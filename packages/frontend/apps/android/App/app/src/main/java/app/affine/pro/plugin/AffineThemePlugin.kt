package app.affine.pro.plugin

import com.getcapacitor.JSObject
import com.getcapacitor.Plugin
import com.getcapacitor.PluginCall
import com.getcapacitor.PluginMethod
import com.getcapacitor.annotation.CapacitorPlugin
import timber.log.Timber

@CapacitorPlugin(name = "AffineTheme")
class AffineThemePlugin : Plugin() {

    interface Callback {
        fun onThemeChanged(darkMode: Boolean)
        fun getSystemNaviBarHeight(): Int
    }

    @PluginMethod
    fun onThemeChanged(call: PluginCall) {
        val darkMode = call.data.optBoolean("darkMode")
        Timber.i("onThemeChanged:[ darkMode = $darkMode ]")
        (bridge.activity as? Callback)?.onThemeChanged(darkMode)
        call.resolve()
    }

    @PluginMethod
    fun getSystemNaviBarHeight(call: PluginCall) {
        val height = (bridge.activity as? Callback)?.getSystemNaviBarHeight() ?: 0
        call.resolve(JSObject().put("height", height))
    }
}