module.exports = {
    apps: [{
        name: "node-simrs-api",
        script: "./index.js",
        watch: true,
        env: {
            NODE_ENV: "development",
        }
    }]
}