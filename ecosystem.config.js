module.exports = {
    apps: [{
        name: "node-simrs-api",
        script: "./index.js",
        time: true,
        exec_mode: "cluster",
        watch: true,
        env: {
            NODE_ENV: "development",
        }
    }]
}