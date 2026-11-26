const modifyTitles = () => {
    chrome.storage.sync.get(['autolinks'], function (result) {
        // listitem-title-link matches the text of each title in the pull request list
        document.querySelectorAll('.markdown-title, [data-testid="listitem-title-link"] [data-component="Text"]')
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

        // Changes only titles that contain this reference, so a re-run after every DOM change settles after one pass
        if (!new RegExp(`${autolink.prefix}[${variable}]+`, 'i').test(title.textContent)) {
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
        // Keeps the ticket link's own navigation when the title sits inside a PR link that GitHub handles itself
        title.querySelectorAll('a').forEach(link => link.addEventListener('click', event => event.stopPropagation()));
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
 * Covers titles that GitHub renders after navigation or after loading data,
 * with at most one pass per 100 ms.
 */
let pendingUpdate = null;
const observer = new MutationObserver(() => {
    pendingUpdate ??= setTimeout(() => {
        pendingUpdate = null;
        modifyTitles();
    }, 100);
});
observer.observe(document, {subtree: true, childList: true});
