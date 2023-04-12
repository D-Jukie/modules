const fs = require('fs-extra');
const Youtube = require('youtube-search-api');
const downloadMusicFromYoutube = async (link) => {
    try {
        var axios = require('axios');
        var timestart = Date.now();
        var data = await axios.get(`https://stingray-app-chpom.ondigitalocean.app/download-audio?link=${link}&stream=true`, {
            responseType: 'stream'
        })
        var info = await axios.get(`https://stingray-app-chpom.ondigitalocean.app/download-audio?link=${link}`)
        info = info.data;
        info.timestart = timestart;

        return {
            data: data.data,
            info
        }
    } catch (e) {
        return console.log(e)
    }
}

const handleReply = async ({ api, event, handleReply }) => {
    try {
        const { data, info } = await downloadMusicFromYoutube("https://www.youtube.com/watch?v=" + handleReply.link[event.body - 1]);
        api.unsendMessage(handleReply.messageID);
        const message = {
            body: `🎵 Title: ${info.title}\n⏱️ Thời gian: ${(info.dur)}\n⏱️Thời gian xử lý: ${Math.floor((Date.now() - info.timestart) / 1000)} giây\n💿====DISME PROJECT====💿`,
            attachment: data,
        };
        return api.sendMessage(message, event.threadID, event.messageID);
    } catch (error) {
        console.log(error);
    }
};

const run = async function ({ api, event, args }) {
    if (args.length == 0) return api.sendMessage('» Phần tìm kiếm không được để trống!', event.threadID, event.messageID);

    const keywordSearch = args.join(" ");

    if (args[0].startsWith("https://")) {
        try {
            const { data, info } = await downloadMusicFromYoutube(args[0]);
            const body = `🎵 Title: ${info?.title ?? 'Unknown'}\n⏱️ Thời gian: ${(info?.dur)}\n⏱️Thời gian xử lý: ${Math.floor((Date.now()- info?.timestart)/1000)} giây\n💿====DISME PROJECT====💿`;
            return api.sendMessage({ body, attachment: data }, event.threadID, event.messageID);
        } catch (e) {
            return console.log(e);
        }
    } else {
        try {
            const data = (await Youtube.GetListByKeyword(keywordSearch, false, 6)).items || [];
            const link = data.map(value => value.id);
            const body = `»🔎 Có ${link.length} kết quả trùng với từ khoá tìm kiếm của bạn:\n\n${data.map((value, index) => `${index + 1} - ${value?.title} (${value?.length?.simpleText})\n\n`).join('')}» Hãy reply(phản hồi) chọn một trong những tìm kiếm trên`;

            return api.sendMessage(body, event.threadID, (error, info) => global.client.handleReply.push({
                type: 'reply',
                name: config.name,
                messageID: info.messageID,
                author: event.senderID,
                link
            }), event.messageID);
        } catch (e) {
            return api.sendMessage(`Đã xảy ra lỗi, vui lòng thử lại trong giây lát!!\n${e}`, event.threadID, event.messageID);
        }
    }
};

const config = {
    name: "sing-api",
    version: "1.0.0",
    hasPermssion: 0,
    credits: "D-Jukie",
    description: "Phát nhạc thông qua link YouTube hoặc từ khoá tìm kiếm",
    commandCategory: "Phương tiện",
    usages: "[searchMusic]",
    cooldowns: 0
};

module.exports = { config, run, handleReply };
