$(function () {
    "use strict";

    var //window_width = $(window).width(),
        window_height = window.innerHeight,
        header_height = $(".default-header").height(),
        //header_height_static = $(".site-header.static").outerHeight(),
        fitscreen = window_height - header_height;

    $(".fullscreen").css("height", window_height);
    $(".fitscreen").css("height", fitscreen);

    // Initiate superfish on nav menu
    $('.nav-menu').superfish({
        animation: {
            opacity: 'show'
        },
        speed: 400
    });

    // Mobile Navigation
    if ($('#nav-menu-container').length) {
        var $mobile_nav = $('#nav-menu-container').clone().prop({
            id: 'mobile-nav'
        });
        $mobile_nav.find('> ul').attr({
            'class': '',
            'id': ''
        });
        $('body').append($mobile_nav);
        //<img src="img/icons/bars-solid.svg" loading="lazy" alt="menu" class="hMenu" />
        $('body').prepend('<button type="button" id="mobile-nav-toggle" title="menu"><img src="img/icons/bars-solid.svg" loading="lazy" alt="menu" class="hMenu" width="21.58" height="24.67" /></button>');
        $('body').append('<div id="mobile-body-overly"></div>');
        /*$('#mobile-nav').find('.menu-has-children').prepend('<i class="fas fa-chevron-down"></i>');
  
        $(document).on('click', '.menu-has-children i', function(e) {
            $(this).next().toggleClass('menu-item-active');
            $(this).nextAll('ul').eq(0).slideToggle();
            $(this).toggleClass("fa-chevron-up fa-chevron-down");
        });*/

        $(document).on('click', '#mobile-nav-toggle', () => {
            $('body').toggleClass('mobile-nav-active');
            const mToggleImg = '#mobile-nav-toggle img';
            if ($(mToggleImg).attr('src') == 'img/icons/close-thick.svg') {
                $(mToggleImg).attr('src', 'img/icons/bars-solid.svg');
                $(mToggleImg).attr('width', '21.58');
                $(mToggleImg).attr('height', '24.67');
            } else {
                $(mToggleImg).attr('src', 'img/icons/close-thick.svg');
                $(mToggleImg).attr('width', '24.67');
                $(mToggleImg).attr('height', '24.67');
            }
            //$('#mobile-nav-toggle i').toggleClass('fa-times fa-bars');
            $('#mobile-body-overly').toggle();
        });

        //const menuItems = document.querySelectorAll('.menuItem');

        // Loop through the NodeList using forEach
        /*document.querySelectorAll('.menuItem').forEach(function (item) {
            const mToggleImg = '#mobile-nav-toggle img';
            $(mToggleImg).attr('src', 'img/icons/bars-solid.svg');
            $(mToggleImg).attr('width', '21.58');
            $(mToggleImg).attr('height', '24.67');
        });*/

        $(document).click((e) => {
            let container = $("#mobile-nav, #mobile-nav-toggle");
            if (!container.is(e.target) && container.has(e.target).length === 0) {
                if ($('body').hasClass('mobile-nav-active')) {
                    $('body').removeClass('mobile-nav-active');
                    $('#mobile-nav-toggle img').attr('src', 'img/icons/bars-solid.svg');
                    //$('#mobile-nav-toggle i').toggleClass('fa-times fa-bars');
                    $('#mobile-body-overly').fadeOut();
                }
            }
        });
    } else if ($("#mobile-nav, #mobile-nav-toggle").length) {
        $("#mobile-nav, #mobile-nav-toggle").hide();
    }

    $(".user").click((e) => {
        e.preventDefault();
    });

    // Smooth scroll for the menu and links with .scrollto classes
    $('.nav-menu a, #mobile-nav a, .scrollto').on('click', () => {
        try {
            if (location.pathname.replace(/^\//, '') == this.pathname.replace(/^\//, '') && location.hostname == this.hostname) {
                var target = $(this.hash);
                if (target.length) {
                    var top_space = 0;

                    if ($('#header').length) {
                        top_space = $('#header').outerHeight();

                        if (!$('#header').hasClass('header-fixed')) {
                            top_space = top_space;
                        }
                    }

                    $('html, body').animate({
                        scrollTop: target.offset().top - top_space
                    }, 1500, 'easeInOutExpo');

                    if ($(this).parents('.nav-menu').length) {
                        $('.nav-menu .menu-active').removeClass('menu-active');
                        $(this).closest('li').addClass('menu-active');
                    }

                    if ($('body').hasClass('mobile-nav-active')) {
                        $('body').removeClass('mobile-nav-active');
                        $('#mobile-nav-toggle i').toggleClass('fa-times fa-bars');
                        $('#mobile-body-overly').fadeOut();
                    }
                    return false;
                }
            }
        } catch { }
    });

    $(document).ready(() => {
        $('html, body').hide();
        if (window.location.hash) {
            setTimeout(function () {
                $('html, body').scrollTop(0).show();
                $('html, body').animate({
                    scrollTop: $(window.location.hash).offset().top
                }, 1000);
            }, 0);
        } else {
            $('html, body').show();
        }
    });

    // Header scroll class
    $(window).scroll(() => {
        if ($(this).scrollTop() > 100) {
            $('#header').addClass('header-scrolled');
        } else {
            $('#header').removeClass('header-scrolled');
        }
    });

    $('#moreAuthorsCollapse').on('show.bs.collapse', () => {
        $('#btnReadMore').text(translations.readLess); // Or use translations here if needed
    });

    $('#moreAuthorsCollapse').on('hide.bs.collapse', () => {
        $('#btnReadMore').text(translations.readMore);
    });
});

//let authorUnhidden = false;

window.onscroll = () => {
    let scroll = window.scrollY;

    if (scroll > getHeight() * 0.55) {
        if (document.getElementById('aReviews').innerHTML === "") {
            const aScript = document.createElement('script');
            aScript.src = 'https://apps.elfsight.com/p/platform.js';
            document.body.appendChild(aScript);
        }
    }

    if (scroll > getHeight() * 0.7) {
        const gScriptExist = document.getElementById('g_translate');

        if (!gScriptExist) {
            const script = document.createElement('script');
            script.src = 'https://translate.google.com/translate_a/element.js?cb=googleTranslateElementInit';
            script.id = 'g_translate';
            document.body.appendChild(script);
        }
    }
}

function googleTranslateElementInit() {
    new google.translate.TranslateElement({
        pageLanguage: 'en',
        includedLanguages: 'nl,de,fr,it,en,pt',
        autoDisplay: false,
        layout: google.translate.TranslateElement.InlineLayout.SIMPLE
    }, 'google_translate_element');
}

document.getElementById("sDate").innerHTML = new Date().getFullYear();

function getHeight() {
    let body = document.body,
        html = document.documentElement;

    return Math.max(body.scrollHeight, body.offsetHeight, html.clientHeight, html.scrollHeight, html.offsetHeight, body.getBoundingClientRect().height);
}

document.addEventListener("DOMContentLoaded", function () {
    const tiktokContainer = document.getElementById("tiktok-container");

    const embedHTML = `
    <blockquote class="tiktok-embed" cite="https://www.tiktok.com/@federicostories/video/7152795728778185990" data-video-id="7152795728778185990" style="max-width: 605px;min-width: 325px;">
      <section>
        <a target="_blank" title="@federicostories" href="https://www.tiktok.com/@federicostories?refer=embed">@federicostories</a>
        Many years ago, the <a title="blackknight" target="_blank" href="https://www.tiktok.com/tag/blackknight?refer=embed">#blackknight</a> 🗡️ returned to <a title="elsalvador" target="_blank" href="https://www.tiktok.com/tag/elsalvador?refer=embed">#ElSalvador</a>. He wanted to test the Salvadorans' greed. He gave them all their wishes, but the cost was their <a title="souls" target="_blank" href="https://www.tiktok.com/tag/souls?refer=embed">#souls</a>! 👻 ...
      </section>
    </blockquote>`;

    let scriptLoaded = false;

    const observer = new IntersectionObserver((entries, observer) => {
        entries.forEach(entry => {
            if (entry.isIntersecting && !scriptLoaded) {
                tiktokContainer.innerHTML = embedHTML;

                const script = document.createElement('script');
                script.src = 'https://www.tiktok.com/embed.js';
                script.async = true;
                document.body.appendChild(script);

                scriptLoaded = true;
                observer.disconnect();
            }
        });
    });

    observer.observe(tiktokContainer);
});
