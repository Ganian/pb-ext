"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ManaToki = exports.ManaTokiInfo = exports.DEFAULT_URL = void 0;
const paperback_extensions_common_1 = require("paperback-extensions-common");
const TokiSettings_1 = require("./TokiSettings");
const TokiParser_1 = require("./TokiParser");
const GeneralHelper_1 = require("./GeneralHelper");
exports.DEFAULT_URL = "https://manatoki.net";
exports.ManaTokiInfo = {
    name: "ManaToki (마나토끼)",
    icon: "icon.png",
    websiteBaseURL: exports.DEFAULT_URL,
    version: "0.1.0",
    description: "Extension that scrapes webtoons from 마나토끼.",
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
class ManaToki extends paperback_extensions_common_1.Source {
    constructor() {
        super(...arguments);
        this.URL = exports.DEFAULT_URL;
        this.requestManager = createRequestManager({
            requestsPerSecond: 0.5,
            requestTimeout: 10000,
            interceptor: new NewTokiInterceptor(() => this.requestManager),
        });
        this.stateManager = createSourceStateManager({});
        this.updateDomain = async () => this.URL = (await (0, TokiSettings_1.getStateData)(this.stateManager)).domain;
        this.getBaseURL = async () => new GeneralHelper_1.URLBuilder(await this.updateDomain());
        this.getMangaShareUrl = (id) => new GeneralHelper_1.URLBuilder(this.URL)
            .addPath("comic")
            .addPath(id)
            .build();
    }
    async getSourceMenu() {
        return Promise.resolve(createSection({
            id: "main",
            header: "마나토끼 설정",
            rows: () => Promise.resolve([(0, TokiSettings_1.menuGeneralSettings)(this.stateManager)]),
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
            .addPath("comic")
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
        const [results, end] = (0, TokiParser_1.parseSearchResults)(cheerio, this.URL);
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
                .addPath("comic")
                .build(),
            method: "GET",
        });
        const data = await this.requestManager.schedule(req, 2);
        const cheerio = this.cheerio.load(data.data);
        return (0, TokiParser_1.parseSearchTags)(cheerio);
    }
    async getMangaDetails(mangaId) {
        const req = createRequestObject({
            url: (await this.getBaseURL())
                .addPath("comic")
                .addPath(mangaId)
                .build(),
            method: "GET",
        });
        const data = await this.requestManager.schedule(req, 2);
        const cheerio = this.cheerio.load(data.data);
        return (0, TokiParser_1.parseMangaDetails)(cheerio, mangaId);
    }
    async getChapters(mangaId) {
        const req = createRequestObject({
            url: (await this.getBaseURL())
                .addPath("comic")
                .addPath(mangaId)
                .build(),
            method: "GET",
        });
        const data = await this.requestManager.schedule(req, 2);
        const cheerio = this.cheerio.load(data.data);
        return (0, TokiParser_1.parseChapters)(cheerio, mangaId);
    }
    async getChapterDetails(mangaId, id) {
        const req = createRequestObject({
            url: (await this.getBaseURL())
                .addPath("comic")
                .addPath(id)
                .build(),
            method: "GET",
        });
        const data = await this.requestManager.schedule(req, 2);
        return (0, TokiParser_1.parseChapterDetails)(data.data, this.cheerio, mangaId, id);
    }
    async getHomePageSections(sectionCallback) {
        const sections = [
            {
                request: createRequestObject({
                    url: (await this.getBaseURL())
                        .addPath("bbs")
                        .addPath("page.php")
                        .addParam("hid", "update")
                        .build(),
                    method: 'GET'
                }),
                section: createHomeSection({
                    id: 'updates',
                    title: '최신화',
                    view_more: true,
                }),
            },
            {
                request: createRequestObject({
                    url: (await this.getBaseURL())
                        .addPath("comic")
                        .build(),
                    method: 'GET'
                }),
                section: createHomeSection({
                    id: 'list',
                    title: '만화목록',
                    view_more: true
                }),
            },
        ];
        const promises = [];
        for (const section of sections) {
            sectionCallback(section.section);
            promises.push(this.requestManager.schedule(section.request, 3).then(response => {
                const $ = this.cheerio.load(response.data);
                switch (section.section.id) {
                    case 'updates':
                        section.section.items = (0, TokiParser_1.parseHomeUpdates)($).manga;
                        break;
                    case 'list':
                        section.section.items = (0, TokiParser_1.parseHomeList)($).manga;
                        break;
                }
                sectionCallback(section.section);
            }));
        }
        await Promise.all(promises);
    }
    async getViewMoreItems(homepageSectionId, metadata) {
        const page = metadata?.page ?? 1;
        let collectedIds = metadata?.collectedIds ?? [];
        let manga;
        let mData = undefined;
        switch (homepageSectionId) {
            case 'updates': {
                const request = createRequestObject({
                    url: (await this.getBaseURL())
                        .addPath("bbs")
                        .addPath("page.php")
                        .addParam("hid", "update")
                        .addParam("page", page)
                        .build(),
                    method: 'GET'
                });
                const data = await this.requestManager.schedule(request, 3);
                const $ = this.cheerio.load(data.data);
                const parsedData = (0, TokiParser_1.parseHomeUpdates)($, collectedIds);
                manga = parsedData.manga;
                collectedIds = parsedData.collectedIds;
                if (page <= 9)
                    mData = { page: (page + 1), collectedIds: collectedIds };
                break;
            }
            case 'list': {
                const request = createRequestObject({
                    url: (await this.getBaseURL())
                        .addPath("comic")
                        .addPath(`p${page}`)
                        .build(),
                    method: 'GET'
                });
                const data = await this.requestManager.schedule(request, 3);
                const $ = this.cheerio.load(data.data);
                const parsedData = (0, TokiParser_1.parseHomeList)($, collectedIds);
                manga = parsedData.manga;
                collectedIds = parsedData.collectedIds;
                if (page <= 9)
                    mData = { page: (page + 1), collectedIds: collectedIds };
                break;
            }
            default:
                return createPagedResults({
                    results: [],
                    metadata: mData
                });
        }
        return createPagedResults({
            results: manga,
            metadata: mData
        });
    }
}
exports.ManaToki = ManaToki;
class NewTokiInterceptor {
    constructor(requestManager) {
        this.requestManager = requestManager;
    }
    async interceptRequest(req) {
        return req;
    }
    async interceptResponse(res) {
        // FIXME: Test in 0.7
        // If .jpg returns 404, try .jpeg.
        const url = res.request.url;
        if (url.endsWith("jpg") && res.status == 404) {
            const req = res.request;
            req.url = url.slice(0, -3) + "jpeg";
            res = await this.requestManager().schedule(req, 2);
        }
        return res;
    }
}
//# sourceMappingURL=ManaToki.js.map