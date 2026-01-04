const config = {
    appId: 'com.stylecraft.app',
    appName: 'StyleCraft',
    webDir: 'out',
    server: {
        androidScheme: 'https',
        iosScheme: 'https',
    },
    plugins: {
        StatusBar: {
            style: 'dark',
            backgroundColor: '#ffffff',
        },
        Keyboard: {
            resize: 'body',
            style: 'dark',
            resizeOnFullScreen: true,
        },
    },
};

module.exports = config;
