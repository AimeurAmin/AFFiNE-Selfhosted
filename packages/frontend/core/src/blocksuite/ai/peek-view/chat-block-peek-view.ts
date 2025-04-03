import {
  CanvasElementType,
  EdgelessCRUDIdentifier,
  getSurfaceBlock,
} from '@blocksuite/affine/blocks/surface';
import { ConnectorMode } from '@blocksuite/affine/model';
import {
  DocModeProvider,
  NotificationProvider,
  TelemetryProvider,
} from '@blocksuite/affine/shared/services';
import type { SpecBuilder } from '@blocksuite/affine/shared/utils';
import type { EditorHost } from '@blocksuite/affine/std';
import { InformationIcon } from '@blocksuite/icons/lit';
import { html, LitElement, nothing } from 'lit';
import { property, query, state } from 'lit/decorators.js';
import { classMap } from 'lit/directives/class-map.js';
import { repeat } from 'lit/directives/repeat.js';

import {
  ChatBlockPeekViewActions,
  constructUserInfoWithMessages,
  queryHistoryMessages,
} from '../_common/chat-actions-handle';
import { type AIChatBlockModel } from '../blocks';
import type {
  ChatChip,
  DocDisplayConfig,
  SearchMenuConfig,
} from '../components/ai-chat-chips';
import type { AINetworkSearchConfig } from '../components/ai-chat-input';
import type { ChatMessage } from '../components/ai-chat-messages';
import { ChatMessagesSchema } from '../components/ai-chat-messages';
import type { TextRendererOptions } from '../components/text-renderer';
import { AIChatErrorRenderer } from '../messages/error';
import { type AIError, AIProvider } from '../provider';
import { PeekViewStyles } from './styles';
import type { ChatContext } from './types';
import { calcChildBound } from './utils';

export class AIChatBlockPeekView extends LitElement {
  static override styles = PeekViewStyles;

  private get _modeService() {
    return this.host.std.get(DocModeProvider);
  }

  private get parentSessionId() {
    return this.parentModel.props.sessionId;
  }

  private get historyMessagesString() {
    return this.parentModel.props.messages;
  }

  private get parentChatBlockId() {
    return this.parentModel.id;
  }

  private get parentRootDocId() {
    return this.parentModel.props.rootDocId;
  }

  private get parentRootWorkspaceId() {
    return this.parentModel.props.rootWorkspaceId;
  }

  private _textRendererOptions: TextRendererOptions = {};

  private _chatSessionId: string | null | undefined = null;

  private _chatContextId: string | null | undefined = null;

  private _chatBlockId: string | null | undefined = null;

  private readonly _deserializeHistoryChatMessages = (
    historyMessagesString: string
  ) => {
    try {
      const result = ChatMessagesSchema.safeParse(
        JSON.parse(historyMessagesString)
      );
      if (result.success) {
        return result.data;
      } else {
        return [];
      }
    } catch {
      return [];
    }
  };

  private readonly _constructBranchChatBlockMessages = async (
    rootWorkspaceId: string,
    rootDocId: string,
    forkSessionId: string
  ) => {
    const currentUserInfo = await AIProvider.userInfo;
    const forkMessages = await queryHistoryMessages(
      rootWorkspaceId,
      rootDocId,
      forkSessionId
    );
    const forkLength = forkMessages.length;
    const historyLength = this._historyMessages.length;

    if (!forkLength || forkLength <= historyLength) {
      return constructUserInfoWithMessages(forkMessages, currentUserInfo);
    }

    // Update history messages with the fork messages, keep user info
    const historyMessages = this._historyMessages.map((message, idx) => {
      return {
        ...message,
        id: forkMessages[idx]?.id ?? message.id,
        attachments: [],
      };
    });

    const currentChatMessages = constructUserInfoWithMessages(
      forkMessages.slice(historyLength),
      currentUserInfo
    );
    return [...historyMessages, ...currentChatMessages];
  };

  private readonly _resetContext = () => {
    const { abortController } = this.chatContext;
    if (abortController) {
      abortController.abort();
    }

    this.updateContext({
      status: 'idle',
      error: null,
      images: [],
      abortController: null,
      messages: [],
    });
    this._chatSessionId = null;
    this._chatContextId = null;
    this._chatBlockId = null;
  };

  private readonly _getSessionId = async () => {
    // If has not forked a chat session, fork a new one
    if (!this._chatSessionId) {
      const latestMessage = this._historyMessages.at(-1);
      if (!latestMessage) return;

      const forkSessionId = await AIProvider.forkChat?.({
        workspaceId: this.host.doc.workspace.id,
        docId: this.host.doc.id,
        sessionId: this.parentSessionId,
        latestMessageId: latestMessage.id,
      });
      this._chatSessionId = forkSessionId;
    }
    return this._chatSessionId;
  };

  private readonly _getContextId = async () => {
    if (this._chatContextId) {
      return this._chatContextId;
    }
    const sessionId = await this._getSessionId();
    if (sessionId) {
      this._chatContextId = await AIProvider.context?.createContext(
        this.host.doc.workspace.id,
        sessionId
      );
    }
    return this._chatContextId;
  };

  private readonly _getBlockId = () => {
    return this._chatBlockId;
  };

  /**
   * Create a new AI chat block based on the current session and history messages
   */
  createAIChatBlock = async () => {
    // Only create AI chat block in edgeless mode
    const mode = this._modeService.getEditorMode();
    if (mode !== 'edgeless') {
      return;
    }

    // If there is already a chat block, do not create a new one
    if (this._chatBlockId) {
      return;
    }

    // If there is no session id or chat messages, do not create a new chat block
    if (!this._chatSessionId || !this.chatContext.messages.length) {
      return;
    }

    const { doc } = this.host;
    // create a new AI chat block
    const surfaceBlock = doc
      .getAllModels()
      .find(block => block.flavour === 'affine:surface');
    if (!surfaceBlock) {
      return;
    }

    // Get fork session messages
    const { parentRootWorkspaceId, parentRootDocId } = this;
    const messages = await this._constructBranchChatBlockMessages(
      parentRootWorkspaceId,
      parentRootDocId,
      this._chatSessionId
    );
    if (!messages.length) {
      return;
    }

    const bound = calcChildBound(this.parentModel, this.host.std);

    const crud = this.host.std.get(EdgelessCRUDIdentifier);
    const aiChatBlockId = crud.addBlock(
      'affine:embed-ai-chat',
      {
        xywh: bound.serialize(),
        messages: JSON.stringify(messages),
        sessionId: this._chatSessionId,
        rootWorkspaceId: parentRootWorkspaceId,
        rootDocId: parentRootDocId,
      },
      surfaceBlock.id
    );

    if (!aiChatBlockId) {
      return;
    }

    this._chatBlockId = aiChatBlockId;

    // Connect the parent chat block to the AI chat block
    crud.addElement(CanvasElementType.CONNECTOR, {
      mode: ConnectorMode.Curve,
      controllers: [],
      source: { id: this.parentChatBlockId },
      target: { id: aiChatBlockId },
    });

    const telemetryService = this.host.std.getOptional(TelemetryProvider);
    telemetryService?.track('CanvasElementAdded', {
      control: 'conversation',
      page: 'whiteboard editor',
      module: 'canvas',
      segment: 'whiteboard',
      type: 'chat block',
      category: 'branch',
    });
  };

  /**
   * Update the current chat messages with the new message
   */
  updateChatBlockMessages = async () => {
    if (!this._chatBlockId || !this._chatSessionId) {
      return;
    }

    const { doc } = this.host;
    const chatBlock = doc.getBlock(this._chatBlockId);
    if (!chatBlock) return;

    // Get fork session messages
    const { parentRootWorkspaceId, parentRootDocId } = this;
    const messages = await this._constructBranchChatBlockMessages(
      parentRootWorkspaceId,
      parentRootDocId,
      this._chatSessionId
    );
    if (!messages.length) {
      return;
    }
    doc.updateBlock(chatBlock.model, {
      messages: JSON.stringify(messages),
    });
  };

  updateContext = (context: Partial<ChatContext>) => {
    this.chatContext = { ...this.chatContext, ...context };
  };

  updateChips = (chips: ChatChip[]) => {
    this.chips = chips;
  };

  /**
   * Clean current chat messages and delete the newly created AI chat block
   */
  cleanCurrentChatHistories = async () => {
    const notificationService = this.host.std.getOptional(NotificationProvider);
    if (!notificationService) return;

    const { _chatBlockId, _chatSessionId } = this;
    if (!_chatBlockId && !_chatSessionId) {
      return;
    }

    if (
      await notificationService.confirm({
        title: 'Clear History',
        message:
          'Are you sure you want to clear all history? This action will permanently delete all content, including all chat logs and data, and cannot be undone.',
        confirmText: 'Confirm',
        cancelText: 'Cancel',
      })
    ) {
      const { doc } = this.host;
      if (_chatSessionId) {
        await AIProvider.histories?.cleanup(doc.workspace.id, doc.id, [
          _chatSessionId,
        ]);
      }

      if (_chatBlockId) {
        const surface = getSurfaceBlock(doc);
        const crud = this.host.std.get(EdgelessCRUDIdentifier);
        const chatBlock = doc.getBlock(_chatBlockId)?.model;
        if (chatBlock) {
          const connectors = surface?.getConnectors(chatBlock.id);
          doc.transact(() => {
            // Delete the AI chat block
            crud.removeElement(_chatBlockId);
            // Delete the connectors
            connectors?.forEach(connector => {
              crud.removeElement(connector.id);
            });
          });
        }
      }

      notificationService.toast('History cleared');
      this._resetContext();
    }
  };

  /**
   * Retry the last chat message
   */
  retry = async () => {
    const { doc } = this.host;
    const { _chatBlockId, _chatSessionId } = this;
    if (!_chatBlockId || !_chatSessionId) {
      return;
    }

    let content = '';
    try {
      const abortController = new AbortController();

      const messages = [...this.chatContext.messages];
      const last = messages[messages.length - 1];
      if ('content' in last) {
        last.content = '';
        last.createdAt = new Date().toISOString();
      }
      this.updateContext({ messages, status: 'loading', error: null });

      const stream = AIProvider.actions.chat?.({
        sessionId: _chatSessionId,
        retry: true,
        docId: doc.id,
        workspaceId: doc.workspace.id,
        host: this.host,
        stream: true,
        signal: abortController.signal,
        where: 'ai-chat-block',
        control: 'chat-send',
      });

      if (stream) {
        this.updateContext({ abortController });
        for await (const text of stream) {
          const messages = [...this.chatContext.messages];
          const last = messages[messages.length - 1] as ChatMessage;
          last.content += text;
          this.updateContext({ messages, status: 'transmitting' });
          content += text;
        }

        this.updateContext({ status: 'success' });
      }
    } catch (error) {
      this.updateContext({ status: 'error', error: error as AIError });
    } finally {
      this.updateContext({ abortController: null });
      if (content) {
        // Update new chat block messages if there are contents returned from AI
        await this.updateChatBlockMessages();
      }
    }
  };

  CurrentMessages = (currentMessages: ChatMessage[]) => {
    if (!currentMessages.length) {
      return nothing;
    }

    const { host } = this;
    const actions = ChatBlockPeekViewActions;

    return html`${repeat(
      currentMessages,
      message => message.id || message.createdAt,
      (message, idx) => {
        const { status, error } = this.chatContext;
        const isAssistantMessage = message.role === 'assistant';
        const isLastReply =
          idx === currentMessages.length - 1 && isAssistantMessage;
        const messageState =
          isLastReply && (status === 'transmitting' || status === 'loading')
            ? 'generating'
            : 'finished';
        const shouldRenderError = isLastReply && status === 'error' && !!error;
        const isNotReady = status === 'transmitting' || status === 'loading';
        const shouldRenderCopyMore =
          isAssistantMessage && !(isLastReply && isNotReady);
        const shouldRenderActions =
          isLastReply && !!message.content && !isNotReady;

        const messageClasses = classMap({
          'assistant-message-container': isAssistantMessage,
        });

        const { attachments, role, content, userId, userName, avatarUrl } =
          message;

        return html`<div class=${messageClasses}>
          <ai-chat-message
            .host=${host}
            .state=${messageState}
            .content=${content}
            .attachments=${attachments}
            .messageRole=${role}
            .userId=${userId}
            .userName=${userName}
            .avatarUrl=${avatarUrl}
            .textRendererOptions=${this._textRendererOptions}
          ></ai-chat-message>
          ${shouldRenderError ? AIChatErrorRenderer(host, error) : nothing}
          ${shouldRenderCopyMore
            ? html` <chat-copy-more
                .host=${host}
                .actions=${actions}
                .content=${message.content}
                .isLast=${isLastReply}
                .getSessionId=${this._getSessionId}
                .messageId=${message.id ?? undefined}
                .retry=${() => this.retry()}
              ></chat-copy-more>`
            : nothing}
          ${shouldRenderActions
            ? html`<chat-action-list
                .host=${host}
                .actions=${actions}
                .content=${message.content}
                .getSessionId=${this._getSessionId}
                .messageId=${message.id ?? undefined}
                .layoutDirection=${'horizontal'}
              ></chat-action-list>`
            : nothing}
        </div>`;
      }
    )}`;
  };

  override connectedCallback() {
    super.connectedCallback();
    this._textRendererOptions = {
      extensions: this.previewSpecBuilder.value,
    };
    this._historyMessages = this._deserializeHistoryChatMessages(
      this.historyMessagesString
    );
    const { parentRootWorkspaceId, parentRootDocId, parentSessionId } = this;
    queryHistoryMessages(
      parentRootWorkspaceId,
      parentRootDocId,
      parentSessionId
    )
      .then(messages => {
        this._historyMessages = this._historyMessages.map((message, idx) => {
          return {
            ...message,
            attachments: messages[idx]?.attachments ?? [],
          };
        });
      })
      .catch((err: Error) => {
        console.error('Query history messages failed', err);
      });
  }

  override firstUpdated() {
    // first time render, scroll ai-chat-messages-container to bottom
    requestAnimationFrame(() => {
      if (this._chatMessagesContainer) {
        this._chatMessagesContainer.scrollTop =
          this._chatMessagesContainer.scrollHeight;
      }
    });
  }

  override render() {
    const { host, _historyMessages } = this;
    if (!_historyMessages.length) {
      return nothing;
    }

    const latestHistoryMessage = _historyMessages[_historyMessages.length - 1];
    const latestMessageCreatedAt = latestHistoryMessage.createdAt;
    const {
      updateChatBlockMessages,
      createAIChatBlock,
      cleanCurrentChatHistories,
      chatContext,
      updateContext,
      networkSearchConfig,
      _textRendererOptions,
    } = this;

    const { messages: currentChatMessages } = chatContext;

    return html`<div class="ai-chat-block-peek-view-container">
      <div class="ai-chat-messages-container">
        <ai-chat-messages
          .host=${host}
          .messages=${_historyMessages}
          .textRendererOptions=${_textRendererOptions}
        ></ai-chat-messages>
        <date-time .date=${latestMessageCreatedAt}></date-time>
        <div class="new-chat-messages-container">
          ${this.CurrentMessages(currentChatMessages)}
        </div>
      </div>
      <chat-block-input
        .host=${host}
        .chips=${this.chips}
        .getSessionId=${this._getSessionId}
        .getContextId=${this._getContextId}
        .getBlockId=${this._getBlockId}
        .updateChatBlock=${updateChatBlockMessages}
        .createChatBlock=${createAIChatBlock}
        .cleanupHistories=${cleanCurrentChatHistories}
        .chatContextValue=${chatContext}
        .updateContext=${updateContext}
        .networkSearchConfig=${networkSearchConfig}
        .docDisplayConfig=${this.docDisplayConfig}
      ></chat-block-input>
      <div class="peek-view-footer">
        ${InformationIcon()}
        <div>AI outputs can be misleading or wrong</div>
      </div>
    </div> `;
  }

  @query('.ai-chat-messages-container')
  accessor _chatMessagesContainer!: HTMLDivElement;

  @property({ attribute: false })
  accessor parentModel!: AIChatBlockModel;

  @property({ attribute: false })
  accessor host!: EditorHost;

  @property({ attribute: false })
  accessor previewSpecBuilder!: SpecBuilder;

  @property({ attribute: false })
  accessor networkSearchConfig!: AINetworkSearchConfig;

  @property({ attribute: false })
  accessor docDisplayConfig!: DocDisplayConfig;

  @property({ attribute: false })
  accessor searchMenuConfig!: SearchMenuConfig;

  @state()
  accessor _historyMessages: ChatMessage[] = [];

  @state()
  accessor chatContext: ChatContext = {
    status: 'idle',
    error: null,
    images: [],
    abortController: null,
    messages: [],
  };

  @state()
  accessor chips: ChatChip[] = [];
}

declare global {
  interface HTMLElementTagNameMap {
    'ai-chat-block-peek-view': AIChatBlockPeekView;
  }
}

export const AIChatBlockPeekViewTemplate = (
  parentModel: AIChatBlockModel,
  host: EditorHost,
  previewSpecBuilder: SpecBuilder,
  docDisplayConfig: DocDisplayConfig,
  searchMenuConfig: SearchMenuConfig,
  networkSearchConfig: AINetworkSearchConfig
) => {
  return html`<ai-chat-block-peek-view
    .parentModel=${parentModel}
    .host=${host}
    .previewSpecBuilder=${previewSpecBuilder}
    .networkSearchConfig=${networkSearchConfig}
    .docDisplayConfig=${docDisplayConfig}
    .searchMenuConfig=${searchMenuConfig}
  ></ai-chat-block-peek-view>`;
};
