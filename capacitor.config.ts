import type { CapacitorConfig } from '@capacitor/cli'

const config: CapacitorConfig = {
  appId: 'com.omnisim.studio',
  appName: 'OmniSim Studio',
  webDir: 'dist',
  bundledWebRuntime: false,
  server: {
    androidScheme: 'https'
  },
  android: {
    allowMixedContent: false
  }
}

export default config
