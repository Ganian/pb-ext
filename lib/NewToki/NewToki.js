"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.NewToki = exports.NewTokiInfo = exports.DEFAULT_NEWTOKI_URL = void 0;
const paperback_extensions_common_1 = require("paperback-extensions-common");
const NewTokiSettings_1 = require("./NewTokiSettings");
const NewTokiParser_1 = require("./NewTokiParser");
const GeneralHelper_1 = require("./GeneralHelper");
exports.DEFAULT_NEWTOKI_URL = "https://newtoki111.com";
exports.NewTokiInfo = {
    name: "NewToki (뉴토끼)",
    icon: "icon.png",
    websiteBaseURL: exports.DEFAULT_NEWTOKI_URL,
    version: "0.1.0",
    description: "Extension that scrapes webtoons from 뉴토끼.",
    author: "Nouun",
    authorWebsite: "https://github.com/nouun/",
    contentRating: paperback_extensions_common_1.ContentRating.ADULT,
    language: paperback_extensions_common_1.LanguageCode.KOREAN,
    sourceTags: [
        {
            text: "Korean (한국어)",
            type: paperback_extensions_common_1.TagType.GREY,
        }
    ],
};
class NewToki extends paperback_extensions_common_1.Source {
    constructor() {
        super(...arguments);
        this.NEWTOKI_URL = exports.DEFAULT_NEWTOKI_URL;
        this.requestManager = createRequestManager({
            requestsPerSecond: 0.5,
            requestTimeout: 10000,
            interceptor: new NewTokiInterceptor(() => this.requestManager),
        });
        this.stateManager = createSourceStateManager({});
        this.updateDomain = async () => this.NEWTOKI_URL = (await (0, NewTokiSettings_1.getStateData)(this.stateManager)).domain;
        this.getBaseURL = async () => new GeneralHelper_1.URLBuilder(await this.updateDomain());
        this.getMangaShareUrl = (id) => new GeneralHelper_1.URLBuilder(this.NEWTOKI_URL)
            .addPath("webtoon")
            .addPath(id)
            .build();
    }
    async getSourceMenu() {
        return Promise.resolve(createSection({
            id: "main",
            header: "뉴토끼 설정",
            rows: () => Promise.resolve([(0, NewTokiSettings_1.menuGeneralSettings)(this.stateManager)]),
        }));
    }
    // eslint-disable-next-line max-len
    async getSearchResults(query, metadata) {
        const page = metadata?.page || 1;
        const title = query.title || "";
        if (metadata?.end) {
            return createPagedResults({ results: [] });
        }
        const url = (await this.getBaseURL())
            .addPath("webtoon")
            .addParam("stx", title)
            .addParam("tag", query.includedTags?.map((tag) => tag.id).join(","));
        if (page > 1)
            url.addPath(`p${page}`);
        const req = createRequestObject({
            url: url.build(),
            method: "GET",
        });
        const data = await this.requestManager.schedule(req, 2);
        const cheerio = this.cheerio.load(data.data);
        const [results, end] = (0, NewTokiParser_1.parseSearchResults)(cheerio, this.NEWTOKI_URL);
        return createPagedResults({
            results,
            metadata: {
                page: page + (end ? 0 : 1),
                end,
            },
        });
    }
    async getSearchTags() {
        const req = createRequestObject({
            url: (await this.getBaseURL())
                .addPath("webtoon")
                .build(),
            method: "GET",
        });
        const data = await this.requestManager.schedule(req, 2);
        const cheerio = this.cheerio.load(data.data);
        return (0, NewTokiParser_1.parseSearchTags)(cheerio);
    }
    async getMangaDetails(mangaId) {
        const req = createRequestObject({
            url: (await this.getBaseURL())
                .addPath("webtoon")
                .addPath(mangaId)
                .build(),
            method: "GET",
        });
        const data = await this.requestManager.schedule(req, 2);
        const cheerio = this.cheerio.load(data.data);
        return (0, NewTokiParser_1.parseMangaDetails)(cheerio, mangaId);
    }
    async getChapters(mangaId) {
        const req = createRequestObject({
            url: (await this.getBaseURL())
                .addPath("webtoon")
                .addPath(mangaId)
                .build(),
            method: "GET",
        });
        const data = await this.requestManager.schedule(req, 2);
        const cheerio = this.cheerio.load(data.data);
        return (0, NewTokiParser_1.parseChapters)(cheerio, mangaId);
    }
    async getChapterDetails(mangaId, id) {
        const req = createRequestObject({
            url: (await this.getBaseURL())
                .addPath("webtoon")
                .addPath(id)
                .build(),
            method: "GET",
        });
        const data = await this.requestManager.schedule(req, 2);
        return (0, NewTokiParser_1.parseChapterDetails)(data.data, this.cheerio, mangaId, id);
    }
    async getHomePageSections(cb) {
        const sorts = [
            {
                id: "as_view",
                name: "인기순",
            },
            {
                id: "as_good",
                name: "추천순",
            },
            {
                id: "as_star",
                name: "별점순",
            },
            {
                id: "new",
                name: "최신",
            },
        ];
        const toonTypes = ["일반웹툰", "성인웹툰", "BL/GL"];
        const stateData = await (0, NewTokiSettings_1.getStateData)(this.stateManager);
        const sections = toonTypes
            .filter((toonType) => stateData.homeSections.includes(toonType))
            .flatMap((toonType) => sorts
            // eslint-disable-next-line
            .map((sort) => { return { sort, toonType }; }))
            .map(({ sort: { id, name }, toonType }, idx) => createHomeSection({
            id: `${toonType}-${id}`,
            type: idx == 0 ?
                paperback_extensions_common_1.HomeSectionType.featured :
                paperback_extensions_common_1.HomeSectionType.singleRowNormal,
            title: `${toonType}: ${name}`,
            view_more: true,
        }));
        const promises = sections.map(async (section) => {
            const [toonType, id] = section.id.split("-");
            cb(section);
            const url = (await this.getBaseURL())
                .addPath("webtoon")
                .addParam("toon", toonType)
                .addParam("sod", "desc");
            if (id != "new") {
                url.addParam("sst", id);
            }
            const req = createRequestObject({
                url: url.build(),
                method: "GET",
            });
            const data = await this.requestManager.schedule(req, 2);
            const cheerio = this.cheerio.load(data.data);
            const [results] = (0, NewTokiParser_1.parseSearchResults)(cheerio, this.NEWTOKI_URL);
            // if (section.type == HomeSectionType.featured) {
            //   result = result.map((res) => {
            //     res.subtitleText = undefined;
            //     return res;
            //   });
            // }
            section.items = results;
            cb(section);
        });
        Promise.all(promises);
    }
    async getViewMoreItems(ID, metadata) {
        if (metadata?.end) {
            return createPagedResults({
                results: [],
                metadata,
            });
        }
        const page = metadata?.page || 1;
        const [toonType, id] = ID.split("-");
        const url = (await this.getBaseURL())
            .addPath("webtoon")
            .addParam("toon", toonType)
            .addParam("sod", "desc");
        if (id != "new")
            url.addParam("sst", id);
        if (page > 1)
            url.addPath(`p${page}`);
        const req = createRequestObject({
            url: url.build(),
            method: "GET",
        });
        const data = await this.requestManager.schedule(req, 2);
        const cheerio = this.cheerio.load(data.data);
        const [results, end] = (0, NewTokiParser_1.parseSearchResults)(cheerio, this.NEWTOKI_URL);
        return createPagedResults({
            results,
            metadata: {
                page: page + 1,
                end,
            },
        });
    }
}
exports.NewToki = NewToki;
class NewTokiInterceptor {
    // constructor(
    //   private requestManager: () => RequestManager,
    // ) {}
    async interceptRequest(req) {
        return req;
    }
    async interceptResponse(res) {
        // FIXME: Figure out why this isn't working.
        // If .jpg returns 404, try .jpeg.
        // const url = res.request.url;
        // if (url.includes("jpg") && res.status == 404) {
        //   const req = res.request;
        //   req.url = url.replaceAll("jpg", "jpeg");
        //   res = await this.requestManager().schedule(req, 2);
        // }
        return res;
    }
}
//# sourceMappingURL=NewToki.js.map