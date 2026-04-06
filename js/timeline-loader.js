console.log("Timeline loader is running!");

document.addEventListener('DOMContentLoaded', function() {
    createStoryJS({
        width: '100%',
        height:	'400',
        source: 'scripts/timeline-data.js',
        source_type: 'json',
        embed_id: 'timeline', //OPTIONAL USE A DIFFERENT DIV ID FOR EMBED
        font: "Default",
        start_at_end: false, //OPTIONAL START AT LATEST DATE
        start_at_slide:	'4', //OPTIONAL START AT SPECIFIC SLIDE
        start_zoom_adjust: '0', //OPTIONAL TWEAK THE DEFAULT ZOOM LEVEL
        hash_bookmark: true, //OPTIONAL LOCATION BAR HASHES
        debug: true, //OPTIONAL DEBUG TO CONSOLE
        lang: 'zh-cn', //OPTIONAL LANGUAGE
        maptype: 'watercolor', //OPTIONAL MAP STYLE
        css: 'style/timeline.css', //OPTIONAL PATH TO CSS
        js: 'scripts/timeline-min.js'	//OPTIONAL PATH TO JS
    });
});