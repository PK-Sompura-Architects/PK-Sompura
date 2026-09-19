// Single source of truth for how to reach the business.
// The footer and the lineage cards both read from here, so a number only ever
// has to change in one place.
// A blank field is simply not rendered, so a missing detail shortens the
// footer rather than showing a wrong one.
export const CONTACT = {
    // The ?stkn= tracking parameter Instagram appends to a shared link is
    // per-share and expires, so only the plain profile URL is stored.
    instagram: "https://www.instagram.com/p.k_sompura",
    email: "pksompura35@gmail.com",
    phone: "+91 92278 66635",
    place: "Palitana, Gujarat, India",
};

// Numbers shown on the individual lineage cards.
// Kept as the record of the office numbers. The lineage cards no longer
// read this -- a card shows the number stored on that person in the admin
// panel, because this list has no way of saying whose number is whose.
export const CONTACT_NUMBERS = [
    "9227866635",
    "9227866634",
    "9427287387",
    "9429638738",
];
