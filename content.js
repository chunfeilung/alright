const modifyTitles = () => {
    chrome.storage.sync.get(['autolinks'], function (result) {
        document.querySelectorAll('.markdown-title')
            .forEach((title) => {
                addAutolinksToTitle(Object.values(result?.autolinks || []), title);
            });
    });
}

/**
 * @param {Autolink[]} autolinks
 * @param {HTMLElement} title
 */
const addAutolinksToTitle = (autolinks, title) => {
    autolinks.forEach(autolink => {
        const variable = autolink.isAlphanumeric ? '0-9A-Za-z' : '0-9';

        // Prevent double replacements
        if (title.innerHTML.includes(autolink.target.replace('<num>', ''))) {
            return;
        }

        // Prevent HTML injection into <a> title attributes
        if (title.querySelector('a')) {
            title = title.querySelector('a');
        }


        // Titles on issues page appear to be wrapped in a <span> tag whose
        // class name may use the same prefix as a user-configured autolink.
        if (title.children[0]?.tagName?.toLowerCase() === 'span') {
            title.onclick = (evt) => {
                evt.preventDefault();
                evt.stopPropagation();
                window.location = evt.target.href;
            }
            title.innerText = title.children[0].innerText;
        }

        const refNumberRegex = new RegExp(`${autolink.prefix}([${variable}]+)`, 'gi');
        title.innerHTML = title.innerHTML.replace(
            refNumberRegex,
            `<a href="${autolink.target.replace('<num>', '$1')}">${autolink.prefix}$1</a>`
        )
    })
}

/**
 * A window.onload that also works in Firefox.
 */
function modifyTitlesOnLoad() {
    if (document.readyState === 'complete' || document.readyState === 'interactive') {
        modifyTitles();
    } else {
        window.addEventListener('DOMContentLoaded', modifyTitles);
    }
}
modifyTitlesOnLoad();

/**
 * A window.navigation.addEventListener that also works in Firefox.
 */
let lastUrl = location.href;
const observer = new MutationObserver(() => {
    if (location.href !== lastUrl) {
        lastUrl = location.href;
        // Wait for the page to load before modifying titles
        setTimeout(modifyTitles, 100);
    }
});
observer.observe(document, {subtree: true, childList: true});
