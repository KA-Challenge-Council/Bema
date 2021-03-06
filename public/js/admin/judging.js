let flaggedEntriesTable = document.querySelector("#flagged-entries-table");
let flaggedEntriesTableBody = document.querySelector("#flagged-entries-table-body");
let judgingGroupsTable = document.querySelector("#judging-groups-table");
let judgingGroupsTableBody = document.querySelector("#judging-groups-table-body");
let assignedGroupsTable = document.querySelector("#assigned-groups-table");
let assignedGroupsTableBody = document.querySelector("#assigned-groups-table-body");
let judgingCriteriaTableBody = document.querySelector("#judging-criteria-table-body");
let flaggedEntriesSpinner = document.querySelector("#flagged-entries-spinner");
let judgingGroupsSpinner = document.querySelector("#judging-groups-spinner");
let assignedGroupsSpinner = document.querySelector("#assigned-groups-spinner");
let judgingCriteriaSpinner = document.querySelector("#judging-criteria-spinner");
let assignGroupsDraggableContainer = document.querySelector("#judging-group-sortable-container");
let tab = document.querySelector("#sidebar-judging");

// Load page data
request("get", "/api/internal/entries/flagged", null, data => {
    if (!data.error) {
        if (data.logged_in) {
            flaggedEntriesSpinner.style.display = "none";

            if (data.flaggedEntries.length === 0) {
                flaggedEntriesTable.innerHTML = "All flagged entries have been reviewed!"
            } else {
                data.flaggedEntries.forEach(e => {
                    flaggedEntriesTableBody.innerHTML += `
                    <tr id="${e.entry_id}">
                        <td>${e.entry_id}</td>
                        <td><a href="${e.entry_url}" target="_blank">${e.entry_title}</a></td>
                        <td>${e.entry_author}</td>
                        <td>${e.entry_created}</td>
                        ${permissions.edit_entries || permissions.delete_entries || data.is_admin ? `
                            <td id="${e.entry_id}-actions" class="flagged-entry-actions actions">
                                ${permissions.edit_entries || data.is_admin ? `
                                    <a class="btn-tertiary" onclick="approveEntry(${e.entry_id})">Approve</a>
                                    <a class="btn-destructive-tertiary" onclick="disqualifyEntry(${e.entry_id})">Disqualify</a>
                                ` : ""}
                                ${permissions.delete_entries || data.is_admin ? `
                                    <a class="btn-destructive-tertiary" onclick="showConfirmModal('Delete Entry?', 'Are you sure you want to delete this entry? This action cannot be undone.', 'deleteEntry(${e.entry_id})', true, 'Delete')">Delete</a>
                                ` : ""}
                            </td>`
                        : ""}
                    </tr>`;
                });
            }
        }
    } else {
        displayError(data.error);
    }
});

request("get", "/api/internal/admin/getEvaluatorGroups", null, data => {
    if (!data.error) {
        if (data.logged_in) {
            judgingGroupsSpinner.style.display = "none";

            if (data.evaluatorGroups.length === 0) {
                judgingGroupsTable.innerHTML = "No judging groups have been created."
            } else {
                data.evaluatorGroups.forEach(g => {
                    judgingGroupsTableBody.innerHTML += `
                    <tr>
                        <td>${g.group_id}</td>
                        <td>${g.group_name}</td>
                        <td>${g.is_active ? "Active" : "Inactive"}</td>
                        ${permissions.manage_judging_groups || data.is_admin ? `
                            <td class="judging-group-actions actions">
                                <i class="actions-dropdown-btn" onclick="showActionDropdown('judging-group-dropdown-${g.group_id}');"></i>
                                <div class="actions-dropdown-content" hidden id="judging-group-dropdown-${g.group_id}">
                                    <a href="javascript:void(0);" onclick="showEditEvaluatorGroupForm(${g.group_id}, '${g.group_name}', ${g.is_active})">Edit</a>
                                    <a href="javascript:void(0);" onclick="showConfirmModal('Delete Group?', 'Are you sure you want to delete this judging group? This action cannot be undone, and any evaluators or entries assigned to the group will be unassigned.', 'deleteEvaluatorGroup(${g.group_id})', true, 'Delete')">Delete</a>
                                </div>
                            </td>`
                        : ""}
                    </tr>`;

                    if (g.is_active && (permissions.assign_evaluator_groups || data.is_admin)) {
                        assignGroupsDraggableContainer.innerHTML += `
                        <ul id="judging-group-${g.group_id}-sortable" class="judging-group-sortable sortable-list" data-group-id="${g.group_id}">
                            <span class="sortable-list-title">${g.group_name}</span>
                        </ul>
                        `;
                    }
                });
            }
            assignedGroupsSpinner.style.display = "none";
            data.evaluators.forEach(e => {
                let groupName = "";
                data.evaluatorGroups.forEach(g => {
                    if (e.group_id === g.group_id) {
                        groupName = " - " + g.group_name;
                    }

                    if (g.is_active && e.group_id === g.group_id) {
                        let container = document.querySelector("#judging-group-sortable-container #judging-group-" + e.group_id + "-sortable");
                        container.innerHTML += `
                            <li data-user-id="${e.evaluator_id}">${e.evaluator_name}</li>
                        `;
                    }
                });

                assignedGroupsTableBody.innerHTML += `
                <tr>
                    <td>${e.evaluator_id}</td>
                    <td>${e.evaluator_name}</td>
                    <td>${e.group_id ? e.group_id : "None"}${groupName}</td>
                </tr>`;
            });

            data.evaluatorGroups.forEach(g => {
                $("#judging-group-" + g.group_id + "-sortable").sortable({
                    connectWith: ".judging-group-sortable"
                }).disableSelection();
            });
            $("#judging-group-null-sortable").sortable({
                connectWith: ".judging-group-sortable"
            }).disableSelection();
        }
    } else {
        displayError(data.error);
    }
});

request("get", "/api/internal/judging/allCriteria", null, data => {
    if (!data.error) {
        judgingCriteriaSpinner.style.display = "none";

        data.judging_criteria.forEach(c => {
            judgingCriteriaTableBody.innerHTML += `
            <tr id="${c.criteria_id}">
                <td>${c.criteria_id}</td>
                <td>${c.criteria_name}</td>
                <td style='text-align: left'>${c.criteria_description}</td>
                <td>${c.is_active ? 'Yes' : 'No'}</td>
                <td>${c.sort_order}</td>
                ${permissions.manage_judging_criteria || data.is_admin ? `
                    <td class="actions">
                        <i class="actions-dropdown-btn" onclick="showActionDropdown('judging-criteria-dropdown-${c.criteria_id}');"></i>
                        <div class="actions-dropdown-content" hidden id="judging-criteria-dropdown-${c.criteria_id}">
                            <a href="javascript:void(0);" onclick="showEditJudgingCriteriaForm(${c.criteria_id}, '${c.criteria_name}', '${c.criteria_description}', ${c.is_active}, ${c.sort_order})">Edit</a>
                            <a href="javascript:void(0);" onclick="showConfirmModal('Delete Criteria?', 'Are you sure you want to delete this judging criteria? This action cannot be undone. Make the criteria inactive instead to preserve its contents.', 'deleteJudgingCriteria(${c.criteria_id})', true, 'Delete')">Delete</a>
                        </div>
                    </td>`
                : "" }
            </tr>`;
        });
    } else {
        displayError(data.error);
    }
});

// Handle entry action requests
let approveEntry = (entry_id) => {
    request("put", "/api/internal/entries/approve", {
        entry_id
    }, (data) => {
        if (!data.error) {
            window.setTimeout(() => window.location.reload(), 1000);
        } else {
            displayError(data.error);
        }
    });
}
let disqualifyEntry = (entry_id) => {
    request("put", "/api/internal/entries/disqualify", {
        entry_id
    }, (data) => {
        if (!data.error) {
            window.setTimeout(() => window.location.reload(), 1000);
        } else {
            displayError(data.error);
        }
    });
}
let deleteEntry = (entry_id) => {
    request("delete", "/api/internal/entries", {
        entry_id
    }, (data) => {
        if (!data.error) {
            window.setTimeout(() => window.location.reload(), 1000);
        } else {
            displayError(data.error);
        }
    });
}

// Handle group action requests
let addEvaluatorGroup = (e) => {
    e.preventDefault();
    let body = {};
    for (key of e.target) {
        body[key.name] = key.value;
    }
    delete body[""];

    request("post", "/api/internal/admin/addEvaluatorGroup", body, (data) => {
        if (!data.error) {
            window.setTimeout(() => window.location.reload(), 1000);
        } else {
            displayError(data.error);
        }
    });
}

let editEvaluatorGroup = (e) => {
    e.preventDefault();
    let body = {};
    for (key of e.target) {
        if (key.name === "is_active") {
            body[key.name] = key.checked;
        } else {
            body[key.name] = key.value;
        }
    }
    delete body[""];

    request("put", "/api/internal/admin/editEvaluatorGroup", body, (data) => {
        if (!data.error) {
            window.setTimeout(() => window.location.reload(), 1000);
        } else {
            displayError(data.error);
        }
    });
}

let deleteEvaluatorGroup = (group_id) => {
    request("delete", "/api/internal/admin/deleteEvaluatorGroup", {
        group_id
    }, (data) => {
        if (!data.error) {
            window.setTimeout(() => window.location.reload(), 1000);
        } else {
            displayError(data.error);
        }
    });
}

let assignEvaluatorGroups = () => {
    let groups = document.querySelectorAll("#judging-group-sortable-container .judging-group-sortable");

    for (let g = 0; g < groups.length; g++) {
        let group_id = groups[g].dataset.groupId === "null" ? null : groups[g].dataset.groupId;
        for (let e = 1; e < groups[g].children.length; e++) {
            let user_id = groups[g].children[e].dataset.userId;
            request("put", "/api/internal/users/assignToEvaluatorGroup", {
                group_id: group_id,
                evaluator_id: user_id
            }, (data) => {
                if (!data.error) {
                    window.setTimeout(() => window.location.reload(), 1000);
                } else {
                    displayError(data.error);
                }
            });
        }
    }
}

let addJudgingCriteria = (e) => {
    e.preventDefault();
    let body = {};
    for (key of e.target) {
        if (key.name === "is_active") {
            body[key.name] = key.checked;
        } else {
            body[key.name] = key.value;
        }
    }
    delete body[""];

    request("post", "/api/internal/judging/criteria", body, (data) => {
        if (!data.error) {
            window.setTimeout(() => window.location.reload(), 1000);
        } else {
            displayError(data.error);
        }
    });
}

let editJudgingCriteria = (e) => {
    e.preventDefault();
    let body = {};
    for (key of e.target) {
        if (key.name === "is_active") {
            body[key.name] = key.checked;
        } else {
            body[key.name] = key.value;
        }
    }
    delete body[""];

    request("put", "/api/internal/judging/criteria", body, (data) => {
        if (!data.error) {
            window.setTimeout(() => window.location.reload(), 1000);
        } else {
            displayError(data.error);
        }
    });
}

let deleteJudgingCriteria = (criteria_id) => {
    request("delete", "/api/internal/judging/criteria", {
        criteria_id
    }, (data) => {
        if (!data.error) {
            window.setTimeout(() => window.location.reload(), 1000);
        } else {
            displayError(data.error);
        }
    });
}

// Displays forms
let showEditEvaluatorGroupForm = (...args) => {
    // args: group_id, group_name, is_active
    let editEvaluatorGroupForm = document.querySelector("#edit-judging-group-form");
    for (let i = 0; i < editEvaluatorGroupForm.length - 1; i++) {
        if (editEvaluatorGroupForm[i].name === "is_active") {
            editEvaluatorGroupForm[i].checked = args[i];
        } else {
            editEvaluatorGroupForm[i].value = args[i];
        }
    }

    showPage("edit-group-page");
}

let showEditJudgingCriteriaForm = (...args) => {
    let editJudgingCriteriaForm = document.querySelector("#edit-judging-criteria-form");
    for (let i = 0; i < editJudgingCriteriaForm.length - 1; i++) {
        if (editJudgingCriteriaForm[i].name === "is_active") {
            editJudgingCriteriaForm[i].checked = args[i];
        } else {
            editJudgingCriteriaForm[i].value = args[i];
        }
    }

    showPage("edit-judging-criteria-page");
}

// Update navbar highlighting
tab.classList.add("selected");
