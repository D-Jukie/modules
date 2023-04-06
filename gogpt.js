const axios = require('axios');
var suffixes = "?";
module.exports.config = {
    name: "gogpt",
    version: "1.1.0",
    hasPermssion: 0,
    credits: "D-Jukie",
    description: "Hỏi đáp với bot",
    commandCategory: "[]",
    cooldowns: 0
};

module.exports.onLoad = () => {
    global.oldMessageGoGPT = {}
    global.roleGoGPT = {};
}
module.exports.run = async ({ event, api, args }) => {
    let body = args.join(" ");
    if(body == "help") return api.sendMessage("Sử dụng: <prefix>gogpt <nội dung/reply>\nBạn có thể sử dụng dấu "+ suffixes + " ở cuối để GPT trả lời", event.threadID, event.messageID);
    if (event.type == "message_reply") {
        body = event.messageReply.body;
    }
    var role = body.split("---")[1];
    if(role) {
        body = body.split("---")[0];
        global.roleGoGPT[event.senderID] = role;
        delete global.oldMessageGoGPT[event.senderID];
    }
    if(global.roleGoGPT[event.senderID] == undefined) global.roleGoGPT[event.senderID] = "Tôi là ChatGPT, một AI về lập trình hoạt động trên messenger";
    const res = await chatGpt(event, body)
    return api.sendMessage(res, event.threadID, event.messageID);
}


module.exports.handleEvent = async ({ event, api }) => {
    const { body, senderID, threadID, messageID } = event;
    if (!body || senderID == api.getCurrentUserID() || !body.endsWith(suffixes) || body == suffixes || body.indexOf(`${global.config.PREFIX}${this.config.name}`) == 0) return;
    const res = await chatGpt(event, body);
    return api.sendMessage(res, threadID, messageID);
}

async function chatGpt(event, message) {
    if(global.roleGoGPT[event.senderID] == undefined) global.roleGoGPT[event.senderID] = "Tôi là ChatGPT, một AI về lập trình hoạt động trên messenger";

    const oldMessage = global.oldMessageGoGPT[event.senderID];
    const prompt = `${global.roleGoGPT[event.senderID]}\n${oldMessage ? `Người dùng: ${oldMessage.userMessage}\nChatGPT: ${oldMessage.botMessage}\n\n` : ''}Người dùng: ${message}\nChatGPT: `;

    try {
        const content = await getGptResponse();
        global.oldMessageGoGPT[event.senderID] = {
            role: global.roleGoGPT[event.senderID],
            userMessage: message,
            botMessage: content
        };
        return content;
    } catch (error) {
        console.log(error);
        return "Xin lỗi, tôi đang gặp một số trục trặc. Vui lòng thử lại sau!";
    }

    async function getGptResponse() {
        const { data } = await axios.get(`https://gptgo.ai/?q=${encodeURIComponent(prompt)}&hl=vi&hlgpt=vi#gsc.tab=0&gsc.q=${encodeURIComponent(prompt)}&gsc.page=1`);
        const token = data.split('renderUI("')[1].split('")')[0];
        const { data: resp } = await axios.get(`https://gptgo.ai/action_ai_gpt.php?token=${token}`);
        const content = resp.split("\n")
            .filter(line => line.includes("content"))
            .map(line => JSON.parse(line.split('data: ')[1]).choices[0].delta.content)
            .join("");
        return content.split("[DONE]")[0];
    }
}
