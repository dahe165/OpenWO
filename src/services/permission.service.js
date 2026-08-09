const roles = require("../config/roles");


function hasPermission(role, permission) {

    const roleConfig = roles[role];

    if (!roleConfig) {
        return false;
    }

    return roleConfig.permissions.includes(
        permission
    );

}


module.exports = {
    hasPermission
};