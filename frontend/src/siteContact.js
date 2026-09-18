// Single source of truth for how to reach the business.
// The footer and the lineage cards both read from here, so a number only ever
// has to change in one place.
//
// TODO(owner): fill in `instagram` and `email`. Anything left blank is simply
// not rendered -- better a shorter footer than a wrong address.
export const CONTACT = {
    instagram: "",
    email: "",
    phone: "+91 92278 66635",
    place: "Gujarat, India",
};

// Numbers shown on the individual lineage cards.
export const CONTACT_NUMBERS = [
    "9227866635",
    "9227866634",
    "9427287387",
    "9429638738",
];
