/**
 * Represent a form field
 */
class FormValue {
    constructor(id, value, type, name) {
        this.id = id;
        this.value = value;
        this.type = type;
        this.name = name;
    }
}

export { FormValue };