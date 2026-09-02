/**
 * Backward-compatible tabBar icon entrypoint.
 *
 * Claude previously left this filename generating 1x1 placeholder PNG files.
 * Keep the old command working, but route it to the real 81x81 pink icon
 * generator so a future run cannot silently replace valid assets.
 */

require('./gen-tabbar-icons.js')
