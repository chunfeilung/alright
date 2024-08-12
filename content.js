const modifyTitles = () => {
    chrome.storage.sync.get(['autolinks'], function (result) {
        document.querySelectorAll('.markdown-title')
            .forEach((title) => {
                addAutolinksToTitle(Object.values(result.autolinks), title);
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

        title.innerHTML = title.innerHTML.replace(
            new RegExp(`${autolink.prefix}([${variable}]+)`, 'gi'),
            `<a href="${autolink.target.replace('<num>', '$1')}">${autolink.prefix}$1</a>`
        )
    })
}

window.onload = () => modifyTitles();
window.navigation.addEventListener('navigate', () => modifyTitles());
