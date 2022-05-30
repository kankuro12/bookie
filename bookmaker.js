const puppeteerExtra = require('puppeteer-extra');
const pluginStealth = require('puppeteer-extra-plugin-stealth');
const randomUseragent = require('random-useragent');
const axios = require("axios");


class PuppeteerService {


    constructor(loginlink, apiUrl) {
        this.browser = null;
        this.page = null;
        this.logged = false;
        this.pageOptions = null;
        this.waitForFunction = null;
        this.isLinkCrawlTest = null;
        this.loginlink = loginlink;
        // this.crawllink = crawllink;
        this.apiUrl = apiUrl;
        this.pageOptions = {
            waitUntil: 'networkidle2'
        };
        this.i = 1;
    }

    async initBrowser() {

        if (this.browser == null || this.browser == undefined) {
            puppeteerExtra.use(pluginStealth());
            this.browser = await puppeteerExtra.launch({ headless: false });
        }
    }
    login(username, password) {
        return new Promise(async (resolve, reject) => {
            await this.initBrowser();
            const userAgent = randomUseragent.getRandom();
            const crawlResults = { isValidPage: true, pageSource: null };
            try {

                this.page = await this.browser.newPage();
                await this.page.setRequestInterception(true);

                this.page.on('request', (request) => {
                    if (['image', 'stylesheet', 'font'].indexOf(request.resourceType()) !== -1) {
                        request.abort();
                    } else {
                        request.continue();
                    }
                });
                await this.page.setUserAgent(userAgent);
                await this.page.goto(this.loginlink, this.pageOptions);
                await this.page.waitForSelector('input.btnCta_light');
                await this.page.type('#account', username);
                await this.page.type('#password', password);
                await this.page.click('input.btnCta_light');
                await this.page.waitForNavigation({waitUntil: 'networkidle2'});
                console.error(this.page.url());
                this.logged = true;

                try {
                    this.page.on("requestfinished", async req => {
                        if (req.url() == this.apiUrl) {
                            try {
                                const res = req.response();

                                const data = await res.json();
                                const elist = data.Schedule.Data.Leagues.League[0].dateGroup.map((localData) => {
                                    console.log(localData);
                                    const gameData = localData.game[0];
                                    const home = this.makeLink(gameData.htm.toLowerCase());
                                    const away = this.makeLink(gameData.vtm.toLowerCase());
                                    return {
                                        id: gameData.idgm,
                                        url: this.crawllink + away + "-vs-" + home
                                    }
                                });

                            
                                resolve(elist);
                            } catch (error) {
                                reject(error)
                            }
                            console.log("trying for " + (this.i++));
                        }

                    });
                } catch (err) {
                    console.log(err);

                }
                this.page.goto(this.crawllink, this.pageOptions);
            }
            catch (error) {
                console.log(error);
                crawlResults.isValidPage = false;
                reject(error);
            }

        });
    }

    makeLink(str) {
        return str.replaceAll(' ', '-');
    }

    initiate(crawllink) {

        this.crawllink = crawllink;
        return new Promise(async (resolve, reject) => {
            var data = await this.login('BKR760638', 'Sagar@123');
            resolve(data);

        });
    }

}

const puppeteerService = new PuppeteerService('https://www.bookmaker.eu/', 'https://be.bookmaker.eu/BetslipProxy.aspx/GetSchedule');
puppeteerService.initiate('https://be.bookmaker.eu/en/sports/basketball/nba/nba/')
    .then((res) => {
        console.log(res);
    });