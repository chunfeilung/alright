$ = (selector) => document.querySelector(selector);

class Autolink {
    /**
     * @param {boolean} isAlphanumeric
     * @param {string} prefix
     * @param {string} target
     */
    constructor(isAlphanumeric, prefix, target) {
        this.isAlphanumeric = isAlphanumeric === 'true';
        this.prefix = prefix;
        this.target = target;
    }
}

const showMainView = () => {
    $('#add-autolink-button').onclick = showAddAutolinkForm;
    $('#header').style.display = 'flex';
    $('#autolink-table').style.display = 'block';

    showAutolinks();
}

const showAddAutolinkForm = () => {
    $('#header').style.display = 'none';
    $('#autolink-table').style.display = 'none';

    const body = $('body');
    const form = $('#add-autolink-template');
    body.appendChild(form.content.cloneNode(true));
    $('#save-autolink-button').onclick = saveAutolink;
}

/**
 * @param {Event} evt
 */
const saveAutolink = (evt) => {
    evt.preventDefault();

    // Retrieve input
    const isAlphanumeric = $('input[name="is-alphanumeric"]:checked').value;
    const prefix = $('input[name="prefix"]').value;
    const target = $('input[name="target"]').value;

    // Validate input
    if (prefix.trim().length === 0) {
        alert('Reference prefix must not be empty!');
        return false;
    }
    if (!target.startsWith('https://') && !target.startsWith('http://')) {
        alert('The target URL must be a valid URL');
        return false;
    }
    if (target.includes('<num>') === false) {
        alert('The target URL must contain the string "<num>"');
        return false;
    }

    // Save settings
    const autolink = new Autolink(isAlphanumeric, prefix, target);
    chrome.storage.sync.get(['autolinks'], function (result) {
        const autolinks = result?.autolinks || {};
        if (autolinks[autolink.prefix]) {
            alert('This autolink has already been added!');
            return false;
        }
        autolinks[autolink.prefix] = autolink;
        chrome.storage.sync.set({autolinks});

        // Return to main view
        $('body').removeChild($('#add-autolink-form'));
        showMainView();
    });
}

/**
 *
 * @param {Event} evt
 */
const removeAutolink = (evt) => {
    const prefix = evt.target.parentNode.querySelector('.prefix').textContent;

    chrome.storage.sync.get(['autolinks'], function (result) {
        const autolinks = result?.autolinks || {};
        delete autolinks[prefix];
        chrome.storage.sync.set({autolinks})
            .then(() => showAutolinks());
    });
}

const showAutolinks = () => {
    const table = $('#autolink-table');

    chrome.storage.sync.get(['autolinks'], function (result) {
        const autolinks = result?.autolinks || {};
        table.innerHTML = '';

        // Populate autolinks table using template
        for (const key of Object.keys(autolinks)) {
            const autolink = autolinks[key];
            const template = $('#autolink-row-template');
            const row = template.content.cloneNode(true);
            row.querySelector('.prefix').textContent = autolink.prefix;
            row.querySelector('.target').textContent = autolink.target;
            row.querySelector('.variable').textContent = autolink.isAlphanumeric ? '1a23v' : '123';
            row.querySelector('.is-alphanumeric').textContent = autolink.isAlphanumeric ? 'Alphanumeric' : 'Numeric';
            row.querySelector('.remove').onclick = removeAutolink;
            table.appendChild(row);
        }
    });
}

window.onload = () => {
    showMainView();
}
