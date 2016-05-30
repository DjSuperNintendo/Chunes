// This file is required by the index.html file and will
// be executed in the renderer process for that window.
// All of the Node.js APIs are available in this process.

const request = require('request');
const cheerio = require('cheerio');
const tpb = require('thepiratebay');
const kat = require('kat-wrapper');
// const youtube = require('youtube-search');
// const bestVideo = require('youtube-best-video');
let Vue = require('vue');

const panes = new Vue({
    el: '#panes'
});

let navSearch = <HTMLInputElement> document.getElementById('nav-search');
navSearch.addEventListener('keydown', e => {
    if (e.keyCode !== 13)
        return;
    let query = navSearch.value;
    search(query);
});

const audio     = <HTMLAudioElement>  document.getElementById('audio');
const shuffle   = <HTMLAnchorElement> document.getElementById('shuffle');
const back      = <HTMLAnchorElement> document.getElementById('back');
const playPause = <HTMLAnchorElement> document.getElementById('play-pause');
const forward   = <HTMLAnchorElement> document.getElementById('forward');
const repeat    = <HTMLAnchorElement> document.getElementById('repeat');
audio.addEventListener('play', e => playPause.className = 'fa fa-pause');
//audio.addEventListener('timeupdate', e => audio.currentTime)

const elapsed = <HTMLSpanElement> document.getElementById('elapsed');
const len = <HTMLSpanElement> document.getElementById('length');
const scrubber = <HTMLInputElement> document.getElementById('scrubber');

const style = document.createElement('style');
style.setAttribute('type', 'text/css');
document.body.appendChild(style);

scrubber.addEventListener('input', e => {
    const song = (3 * 60) + 16;
    const val = parseInt(scrubber.value);
    const max = parseInt(scrubber.max);
    const ratio = val / max;
    const totalMinutes = song * ratio;
    const minutes = Math.floor(totalMinutes / 60);
    const seconds = Math.floor(totalMinutes % 60);
    elapsed.innerText = minutes + ':' + (seconds < 10 ? '0' : '') + seconds;
    const scrubberWidth = scrubber.clientWidth;
    const gradientOffset = scrubberWidth * ratio;
    const bg = `linear-gradient(to right, darkmagenta ${gradientOffset}px, black ${gradientOffset}px)`; 
    style.innerHTML = `footer #playback #scrubber { background: ${bg}; }`;
    //scrubber.style.background = bg;
});

function youtube(query: string, callback: (results) => void, page: number = 1) {
    request('https://www.youtube.com/results?sp=CAMSAhAB&search_query=' + encodeURI(query) +'&page=' + page, function(error, response, html) {
        let $ = cheerio.load(html);
        const items = $('div#results ol.item-section > li div.yt-uix-tile');
        let links = items.map(function() {
            const $this = $(this);
            const anchor = $this.find('div.yt-lockup-content > h3.yt-lockup-title > a');
            const href: string = anchor.attr('href');
            if (!href.startsWith('/watch?v='))
                return;
            const time = $this.find('span.video-time');
            const thumbnail = $this.find('.yt-thumb-simple > img')
            return {
                title: anchor.attr('title'),
                href: href,
                length: time.html(),
                imgUrl: thumbnail.attr('src')
            };
        });
        callback(links);
    });
}

function search(query: string): void {
    panes.$data = { 
        results: {
            tpb: [],
            kat: [],
            youtube: []
        }
    };
    
    tpb.search(query, {
        category: '101', // Music
        orderBy: '5' // seeds, desc
    }).then(function(results){
        console.log(results);
        panes.$data.results.tpb = results;
    }).catch(function(err){
        console.log(err);
    });
    
    kat.search({
        query: query,
        category: 'music',
        sort_by: 'seeders',
        order: 'desc'
    }).then(function (result) {
        console.log(result);
        panes.$data.results.kat = result.results;
    }).catch(function (error) {
        console.log(error);
    });
    
    youtube(query, results => {
        console.log(results);
        panes.$data.results.youtube = results;
    });
    
    // youtube(query, {}, function(err, results) {
    //     if (err)
    //         return console.log(err);
        
    //     console.log(results);
    //     //console.dir(results);
    // });
    
    // bestVideo.findBestMusicVideo(query, function(err, video) {
    //     if (err)
    //         return console.log(err);
        
    //     console.log(video);
    //     //console.dir(video);
    // });
}