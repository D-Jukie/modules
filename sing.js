const fs = require('fs-extra');
const ytdl = require('ytdl-core');
const Youtube = require('youtube-search-api');
const convertHMS = (value) => new Date(value * 1000).toISOString().slice(11, 19);

const downloadMusicFromYoutube = async (link, path, itag = 249) => {
    try {
        var timestart = Date.now();
        var data = await ytdl.getInfo(link)
        var result = {
            title: data.videoDetails.title,
            dur: Number(data.videoDetails.lengthSeconds),
            viewCount: data.videoDetails.viewCount,
            likes: data.videoDetails.likes,
            author: data.videoDetails.author.name,
            timestart: timestart
        }
        return new Promise((resolve, reject) => {
            ytdl(link, {
                filter: format => format.itag == itag
            }).pipe(fs.createWriteStream(path)).on('finish', () => {
                resolve({
                    data: path,
                    info: result
                })
            })
        })
    } catch (e) {
        return console.log(e)
    }
}

const handleReply = async ({ api, event, handleReply }) => {
    try {
        const path = `${__dirname}/cache/sing-${event.senderID}.mp3`;
        const { data, info } = await downloadMusicFromYoutube("https://www.youtube.com/watch?v=" + handleReply.link[event.body - 1], path);

        if(fs.statSync(data).size > 26214400) return api.sendMessage('Không thể gửi file vì dung lượng lớn hơn 25MB.', event.threadID, () => fs.unlinkSync(path), event.messageID);
        api.unsendMessage(handleReply.messageID);
        const message = {
            body: `🎵 Title: ${info.title}\n⏱️ Thời gian: ${convertHMS(info.dur)}\n⏱️Thời gian xử lý: ${Math.floor((Date.now() - info.timestart) / 1000)} giây\n💿====DISME PROJECT====💿`,
            attachment: fs.createReadStream(data),
        };
        return api.sendMessage(message, event.threadID, async() => {
            fs.unlinkSync(path)
            //iphone
            // const { data, info } = await downloadMusicFromYoutube("https://www.youtube.com/watch?v=" + handleReply.link[event.body - 1], path, 18);
            // if(fs.statSync(data).size > 26214400) return
            // const message = {
            //     body: `🎵 Title: ${info.title}\n⏱️ Thời gian: ${convertHMS(info.dur)}\n⏱️Thời gian xử lý: ${Math.floor((Date.now() - info.timestart) / 1000)} giây\n💿====DISME PROJECT====💿`,
            //     attachment: fs.createReadStream(data),
            // };
            // return api.sendMessage(message, event.threadID, async() => fs.unlinkSync(path), event.messageID);
        }, event.messageID);
    } catch (error) {
        console.log(error);
    }
};

const run = async function ({ api, event, args }) {
    if (!args?.length) return api.sendMessage('» Phần tìm kiếm không được để trống!', event.threadID, event.messageID);

    const keywordSearch = args.join(" ");
    const path = `${__dirname}/cache/sing-${event.senderID}.mp3`;

    if (args[0]?.startsWith("https://")) {
        try {
            const { data, info } = await downloadMusicFromYoutube(args[0], path);
            const body = `🎵 Title: ${info?.title ?? 'Unknown'}\n⏱️ Thời gian: ${convertHMS(info?.dur)}\n⏱️Thời gian xử lý: ${Math.floor((Date.now()- info?.timestart)/1000)} giây\n💿====DISME PROJECT====💿`;

            if (fs.statSync(data).size > 26214400) { return api.sendMessage('Không thể gửi file vì dung lượng lớn hơn 25MB.', event.threadID, () => fs.unlinkSync(data), event.messageID); }

            return api.sendMessage({ body, attachment: fs.createReadStream(data) }, event.threadID, () => fs.unlinkSync(data), event.messageID);
        } catch (e) {
            return console.log(e);
        }
    } else {
        try {
            const data = (await Youtube.GetListByKeyword(keywordSearch, false, 6))?.items ?? [];
            const link = data.map(value => value?.id);
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
    name: "sing",
    version: "1.0.0",
    hasPermssion: 0,
    credits: "D-Jukie",
    description: "Phát nhạc thông qua link YouTube hoặc từ khoá tìm kiếm",
    commandCategory: "Phương tiện",
    usages: "[searchMusic]",
    cooldowns: 0
};

module.exports = { config, run, handleReply };
