"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.parseChapterDetails = exports.parseChapters = exports.parseMangaDetails = exports.parseSearchTags = exports.parseSearchResults = void 0;
const paperback_extensions_common_1 = require("paperback-extensions-common");
const GeneralHelper_1 = require("./GeneralHelper");
const parseTime = (timeString) => {
    if (timeString.includes(":")) {
        const [month, day, year] = new Date()
            .toLocaleDateString("en-US", { timeZone: "Asia/Seoul" })
            .split("/")
            .map((part) => part.padStart(2));
        return new Date([year, month, day].join("-") + "T" + timeString + ":00+09:00");
    }
    else {
        return new Date(timeString.replace(/\./g, "-") + "T00:00:00+09:00");
    }
};
const parseSearchResults = ($, baseDomain) => {
    const results = $("#webtoon-list-all > li > div > div > .imgframe")
        .toArray()
        .map((tile) => {
        const id = $(".img-item > a", tile)
            .attr("href")
            .match(/webtoon\/(\d+)/)[1];
        if (!id)
            throw Error("Unable to match search result ID");
        let image = $(".img-item > a > img", tile).attr("src");
        const imageParts = image
            .match(/\.[a-zA-Z]*\/(.*)\/thumb-([^.]*)_\d+x\d+\.jpe?g/);
        if (imageParts) {
            image = new GeneralHelper_1.URLBuilder(baseDomain)
                .addPath(imageParts[1])
                .addPath(imageParts[2] + ".jpg")
                .build();
        }
        const title = (0, GeneralHelper_1.createText)($(".title", tile).text());
        const subtitleText = (0, GeneralHelper_1.createText)($(".list-date", tile).text());
        return createMangaTile({
            id,
            image,
            title,
            subtitleText,
        });
    });
    const end = $(".disabled > a > .fa-angle-double-right")
        .toArray()
        .length != 0;
    return [
        results,
        end,
    ];
};
exports.parseSearchResults = parseSearchResults;
const parseSearchTags = ($) => {
    const genres = $(".s-genre")
        .toArray()
        .map((el) => $(el).attr("data-value"))
        .filter((tag) => !!tag)
        .map((tag) => createTag({
        id: tag,
        label: tag,
    }));
    return [
        createTagSection({
            id: "tag",
            label: "장르",
            tags: genres,
        }),
    ];
};
exports.parseSearchTags = parseSearchTags;
const parseMangaDetails = ($, id) => {
    const el = $(".view-title > .view-content > .row");
    const image = $("div > .view-content1 > .view-img > img", el).attr("src");
    const titles = [
        $("div > .view-content > span > b", el).text()
            .trim(),
    ];
    const descEl = $("div > .view-content", el).get(1);
    const desc = $(descEl)
        .text()
        .trim();
    return createManga({
        id,
        image,
        titles,
        desc,
        status: paperback_extensions_common_1.MangaStatus.UNKNOWN,
    });
};
exports.parseMangaDetails = parseMangaDetails;
const parseChapters = ($, mangaId) => {
    const chapters = $("#serial-move > .serial-list > .list-body > .list-item").toArray();
    return chapters.map((chapter) => {
        const linkEl = $(".wr-subject > .item-subject", chapter);
        const id = linkEl
            .attr("href")
            .match(/webtoon\/(\d+)/)[1];
        if (!id)
            throw Error("Unable to match search result ID");
        const name = linkEl
            .contents()
            .filter(function () {
            return this.nodeType === 3;
        })
            .text()
            .trim();
        const chapNum = parseFloat($(".wr-num", chapter).text()) || 1;
        const timeStr = $(".wr-date", chapter)
            .text()
            .trim();
        const time = parseTime(timeStr);
        return createChapter({
            id,
            mangaId,
            name,
            chapNum,
            time,
            langCode: paperback_extensions_common_1.LanguageCode.KOREAN,
        });
    });
};
exports.parseChapters = parseChapters;
const parseChapterDetails = (data, cheerio, mangaId, id) => {
    let pages = [];
    try {
        const htmlRegex = /var( *html_data *\+?= *'([A-Z0-9]{2}\.)*';? *\n?)+/;
        const scriptRegex = /unescape\('(%[A-Z0-9]{2})+'\)/;
        // @ts-ignore
        const htmlDataScript = data.match(htmlRegex)[0];
        // @ts-ignore
        const htmlData = eval(htmlDataScript);
        // @ts-ignore
        let script = data.match(scriptRegex)[0];
        console.log("Original Script: " + script);
        // @ts-ignore
        script = eval(script);
        // @ts-ignore
        script = script.substr(0, script.lastIndexOf("<"));
        script = script.substr(script.lastIndexOf(">") + 1);
        script = script.replace(/document\..*=/, "return ");
        script = script.replace(/document\..*\((.*)\)/, "return $1");
        const funcName = (script.match(/function +(.*?)\(/) ?? [0, "html_encoder"])[1];
        console.log("parsed: " + script);
        const out = eval("var l;" + script + `${funcName}(htmlData)`);
        console.log("Output: " + out);
        const $ = cheerio.load(out);
        pages = $("div > img")
            .toArray()
            .map((page) => $(page).get(0).attribs)
            .map((attribs) => attribs[Object.keys(attribs).filter((attrib) => attrib.startsWith("data-"))[0] ?? "data"]);
    }
    catch {
        throw Error("Unable to evaluate server chapter code.");
    }
    return createChapterDetails({
        mangaId,
        id,
        pages,
        longStrip: false,
    });
};
exports.parseChapterDetails = parseChapterDetails;
//# sourceMappingURL=NewTokiParser.js.map