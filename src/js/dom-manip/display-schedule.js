import {
    find,
    add_class
} from './utils';

// populate the dom tree with schedule info
export default function display_schedule (grouped, max_same_day) {
    var i, j;

    var head_tr = find('tr');
    for (i = 0; i < grouped.length; i++) {
        var first_stream = grouped[i][0];
        var th = document.createElement("th");
        th.textContent = first_stream.start.format("dddd");
        // save reference to elements for highlighting later
        first_stream.dom_elements.push(th);
        head_tr.appendChild(th);
    }

    var body = find("tbody");
    for (i = 0; i < max_same_day; i++) {
        var tr = filled_tr(grouped.length);
        if (i !== 0) {
            tr.className = "auxiliary-slots";
        }
        body.appendChild(tr);
    }

    for (i = 0; i < grouped.length; i++) {
        for (j = 0; j < grouped[i].length; j++) {
            var target_stream = grouped[i][j];
            var target_element = body.children[j].children[i];

            target_element.appendChild(gen_schedule_node(target_stream));
            // save reference to elements for highlighting later
            target_stream.dom_elements.push(target_element);
            if (j >= 1) {
                // this is for the mobile view, thus body.children[0]
                body.children[0].children[i]
                    .appendChild(gen_schedule_node(target_stream, true));
            }
        }
    }

    function filled_tr (num_columns) {
        var tr = document.createElement("tr");
        while (tr.children.length < num_columns) {
            tr.appendChild(document.createElement("td"));
        }
        return tr;
    }
}

function gen_schedule_node (stream, same_line) {
    var node = document.createElement("span");
    var node_text = stream.toString();
    if (same_line) {
        node_text = ", " + node_text;
        add_class(node, "same-line-slots");
    }
    node.textContent = node_text;
    if (stream.canceled) {
        add_class(node, "canceled");
    }
    return node;
}
