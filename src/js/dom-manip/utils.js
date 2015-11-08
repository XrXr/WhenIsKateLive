export function find (selector) {
    return document.querySelector(selector);
}

export function add_class (node, name) {
    node.classList.add(name);
}

export function remove_class (node, name) {
    node.classList.remove(name);
}
