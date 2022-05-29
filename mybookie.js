const puppeteerExtra = require('puppeteer-extra');
const pluginStealth = require('puppeteer-extra-plugin-stealth');
const randomUseragent = require('random-useragent');
const axios = require("axios");
var fs = require('fs');

class PuppeteerService {

    constructor() {
        this.browser = null;
        this.page = null;
        this.pageOptions = null;
        this.waitForFunction = null;
        this.isLinkCrawlTest = null;
        this.i = 1;

    }

    async initiate(isLinkCrawlTest) {
        let El;
        this.pageOptions = {
            waitUntil: 'networkidle2',
            // timeout: 30000000
        };
        this.waitForFunction = 'document.querySelector("body")';
        puppeteerExtra.use(pluginStealth());
        // const browser = await puppeteerExtra.launch({ headless: true });
        this.browser = await puppeteerExtra.launch({ headless: false });
        this.page = await this.browser.newPage();
        console.log("page inititated");
        
        this.isLinkCrawlTest = isLinkCrawlTest;
        var link = this.generateLink();
        return await this.crawl(link);
        


    }

    generateLink() {
             
        const apiUrl = `https://www.mybookie.ag/sportsbook/nba/`;
        return apiUrl;
    }
    parse(url) {
        var splitURL = url.slice(url.lastIndexOf("=") + 1);
        return splitURL;
    };




    async crawl(link) {
        const userAgent = randomUseragent.getRandom();
        const crawlResults = { isValidPage: true, pageSource: null };
        try {
         
            await this.page.setUserAgent(userAgent);
            await this.page.goto(link, this.pageOptions);
            await this.page.waitForSelector('.game-lines');
            let urls = await this.page.evaluate(()=>{
                const datas=[];
                const mainList=  document.querySelectorAll('.game-lines .line-default .game-line');
                mainList.forEach(localData => {
                    try {
                        const metaDatas=localData.querySelector('.event-wrapper');
                        const id=localData.querySelectorAll('.game-line__visitor-line button')[0].getAttribute('data-gameid');
                        const visitor={
                            teamname:localData.querySelectorAll('.game-line__visitor-line button')[0].getAttribute('data-team'),
                            spread:{
                                spread:localData.querySelector('.game-line__visitor-line button[data-wager-type="sp"]').getAttribute('data-spread'),
                                odd:localData.querySelector('.game-line__visitor-line button[data-wager-type="sp"]').getAttribute('data-odds')
                            },
                            moneyline:{
                                spread:localData.querySelector('.game-line__visitor-line button[data-wager-type="ml"]').getAttribute('data-spread'),
                                odd:localData.querySelector('.game-line__visitor-line button[data-wager-type="ml"]').getAttribute('data-odds')
                            },
                            total:{
                                spread:localData.querySelector('.game-line__visitor-line button[data-wager-type="to"]').getAttribute('data-spread'),
                                odd:localData.querySelector('.game-line__visitor-line button[data-wager-type="to"]').getAttribute('data-odds')
                            }
                        };
                        const home={
                            teamname:localData.querySelectorAll('.game-line__home-line button')[0].getAttribute('data-team'),
                            spread:{
                                spread:localData.querySelector('.game-line__home-line button[data-wager-type="sp"]').getAttribute('data-spread'),
                                odd:localData.querySelector('.game-line__home-line button[data-wager-type="sp"]').getAttribute('data-odds')
                            },
                            moneyline:{
                                spread:localData.querySelector('.game-line__home-line button[data-wager-type="ml"]').getAttribute('data-spread'),
                                odd:localData.querySelector('.game-line__home-line button[data-wager-type="ml"]').getAttribute('data-odds')
                            },
                            total:{
                                spread:localData.querySelector('.game-line__home-line button[data-wager-type="to"]').getAttribute('data-spread'),
                                odd:localData.querySelector('.game-line__home-line button[data-wager-type="to"]').getAttribute('data-odds')
                            }
                        };
                        console.log(visitor);
                        datas.push({
                            start:metaDatas.querySelector('meta[itemprop="startDate"]').getAttribute('content'),
                            end:metaDatas.querySelector('meta[itemprop="endDate"]').getAttribute('content'),
                            name:metaDatas.querySelector('meta[itemprop="performer"]').getAttribute('content'),
                            visitor:visitor,
                            home:home,
                            id:id,
                            url:'https://www.mybookie.ag/sportsbook/nba/?prop='+id
                        })
                        
                    } catch (error) {
                        
                    }
                });

                return datas;

            });
            return urls;
        }
        catch (error) {
            console.log(error);
            crawlResults.isValidPage = false;
        }
        if (this.isLinkCrawlTest) {
            this.close();
        }

        return "sagar"
    }

    close() {
        if (!this.browser) {
            this.browser.close();
        }
    }
}

const puppeteerService = new PuppeteerService();
puppeteerService.initiate(true)
    .then((el) => {
        fs.writeFile(__dirname+ '/myjsonfile.json', JSON.stringify(el), 'utf8', (err) => {
            if (err) {  console.error(err);  return; };
            console.log("File has been created");
        });

        console.log(el[0]);
    });