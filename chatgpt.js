const axios = require('axios');
var suffixes = "?";
var tokenGPT = ""
//token lấy ở đây: https://chat.openai.com/api/auth/session //không tốn phí
module.exports.config = {
    name: "ai",
    version: "1.1.0",
    hasPermssion: 0,
    credits: "D-Jukie",
    description: "Hỏi đáp với bot",
    commandCategory: "[]",
    cooldowns: 0
};

module.exports.onLoad = () => {
    global.oldMessageGPT = {}
    global.roleGPT = {};
}
module.exports.run = async ({ event, api, args }) => {
    let body = args.join(" ");
    if(body == "help") return api.sendMessage("Sử dụng: <prefix>ai <nội dung/reply>\nBạn có thể sử dụng dấu ~ ở cuối để GPT trả lời", event.threadID, event.messageID);
    if (event.type == "message_reply") {
        body = event.messageReply.body;
    }
    var role = body.split("---")[1];
    if(role) {
        body = body.split("---")[0];
        global.roleGPT[event.senderID] = role;
        delete global.oldMessageGPT[event.senderID];
    }
    if(global.roleGPT[event.senderID] == undefined) global.roleGPT[event.senderID] = "Tôi là ChatGPT, một AI về lập trình hoạt động trên messenger";
    const res = await chatGpt(event, body, role)
    return api.sendMessage(res, event.threadID, event.messageID);
}


module.exports.handleEvent = async ({ event, api }) => {
    const { body, senderID, threadID, messageID } = event;
    if (!body || senderID == api.getCurrentUserID() || !body.endsWith(suffixes) || body == suffixes) return;
    const res = await chatGpt(event, body);
    return api.sendMessage(res, threadID, messageID);
}

async function chatGpt(event, message) {
    const headers = {
        "Authorization": `Bearer ${tokenGPT}`,
        "Accept": "text/event-stream",
        "Content-Type": "application/json"
    };
    let fullPrompt = global.roleGPT[event.senderID] + "\n";
    const oldMessage = global.oldMessageGPT[event.senderID];
    if (oldMessage) {
        fullPrompt += `Người dùng: ${oldMessage.userMessage}\n`;
        fullPrompt += `ChatGPT: ${oldMessage.botMessage}\n\n`;
    }
    fullPrompt += `Người dùng: ${message}\nChatGPT: `;
    const body = {
        action: "next",
        messages: [{
            id: require('uuid').v4(),
            role: "user",
            content: { content_type: "text", parts: [fullPrompt] }
        }],
        model: "gpt-3.5-turbo",
        parent_message_id: require('uuid').v4(),
    };
    try {
        //https://api.pawan.krd/backend-api/conversation 3 request/giây
        //https://bypass.churchless.tech/api/conversation 5 request/10 giây
        const response = await axios.post("https://bypass.churchless.tech/api/conversation", body, {headers});
        const data = "{" + response.data.split("data: {").pop().split("\n")[0];
        global.oldMessageGPT[event.senderID] = {
            userMessage: message,
            botMessage: JSON.parse(data).message?.content.parts[0]
        };
        return JSON.parse(data).message?.content.parts[0] ?? null;
    } catch (error) {
        return "Xin lỗi, tôi đang gặp một số trục trặc. Vui lòng thử lại sau!";
    }
}
