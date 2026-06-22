import express from "express"
import { createProxyMiddleware } from "http-proxy-middleware"
import morgan from "morgan"


const app = express();

app.use(morgan("dev"));


app.get('/api/status/healthz', (req, res) => {

    res.status(200).json({
        message: "Router is healthy",
        status: 'ok'
    })
})


app.get('/api/status/readyz', (req, res) => {

    res.status(200).json({
        message: "Router is ready",
        status: 'ok'
    })  
})


const proxies = {}
const agentProxies = {}


function getProxy(sandboxId) {

    const target = `http://sandbox-service-${sandboxId}`; // Construct target URL

    if (!proxies[ sandboxId ]) {
        proxies[ sandboxId ] = createProxyMiddleware({
            target,
            changeOrigin: true,
            ws: true,
        })
    }

    return proxies[ sandboxId ];
}

function getAgentProxy(sandboxId) {

    const target = `http://sandbox-service-${sandboxId}:3000`; // Construct target URL

    if (!agentProxies[ sandboxId ]) {
        agentProxies[ sandboxId ] = createProxyMiddleware({
            target,
            changeOrigin: true,
            ws: true,
        })
    }

    return agentProxies[ sandboxId ];
}


app.use((req, res, next) => {

    const host = req.headers.host
    const sandboxId = host.split('.')[0]; // extract only sandboxId

    /**
     * pod1.agent.localhost
     * pod2.preview.localhost
     */
    if(host.split('.')[1] === 'agent') {
        return getAgentProxy(sandboxId)(req, res, next);
    } else {
        return getProxy(sandboxId)(req, res, next);
    }
})


export default app;
