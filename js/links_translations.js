const links_translations = {
    "en": {
        "prezi": "3OA2BbhRZgysnB22bzdX",
        "book": "https://leer.amazon.es/kp/card?asin=B09Z33ZPTV&preview=inline&linkCode=kpe&ref_=cm_sw_r_kb_dp_HJ6YDMXY6BRE1FA9AWE3",
        "contactUs": {
            "key": "hkz0rsUoNkGpGQYpoPHBzg",
            "form": "4"
        }
    },
    "es": {
        "prezi": "3OA2BbhRZgysnB22bzdX",
        "book": "https://leer.amazon.es/kp/card?asin=B0F7FRX1B5&preview=inline&linkCode=kpe&ref_=cm_sw_r_kb_dp_HJ6YDMXY6BRE1FA9AWE3",
        "contactUs": {
            "key": "hkz0rsUoNkGpGQYpoPHBzg",
            "form": "3"
        }
    },
    "zh": {
        "prezi": "8IwA2B6lYhPwonEWAyi9",
        "book": "https://leer.amazon.es/kp/card?asin=B09Z33ZPTV&preview=inline&linkCode=kpe&ref_=cm_sw_r_kb_dp_HJ6YDMXY6BRE1FA9AWE3",
        "contactUs": {
            "key": "hkz0rsUoNkGpGQYpoPHBzg",
            "form": "4"
        }
    },
    "fr": {
        "prezi": "k1IXa0mNdi7IbZjRgyOA",
        "book": "https://leer.amazon.es/kp/card?asin=B09Z33ZPTV&preview=inline&linkCode=kpe&ref_=cm_sw_r_kb_dp_HJ6YDMXY6BRE1FA9AWE3",
        "contactUs": {
            "key": "hkz0rsUoNkGpGQYpoPHBzg",
            "form": "4"
        }
    }
};

const validLinks = links_translations[lang];

document.getElementById("bookPreviewFrame").setAttribute("src", validLinks.book);
document.getElementById("preziPreviewFrame").setAttribute("src", `https://prezi.com/p/embed/${validLinks.prezi}`);

$('#mContactUs').on('show.bs.modal', function (e) {
    console.log('opened');

    const cuScriptExist = document.getElementById('cu_script');

    if (!cuScriptExist) {
        const script = document.createElement('script');
        script.src = 'https://www.cognitoforms.com/f/seamless.js';
        script.id = 'cu_script';
        script.dataset.key = validLinks.contactUs.key;
        script.dataset.form = validLinks.contactUs.form;
        document.getElementById('divContactUs').appendChild(script);
    }
});