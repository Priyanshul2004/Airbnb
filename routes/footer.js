const express = require("express");
const router = express.Router();

// Footer section routes
router.get("/support", (req, res) => {
    res.render("footer/support", { page: 'footer-support' });
});

router.get("/community", (req, res) => {
    res.render("footer/community", { page: 'footer-community' });
});

router.get("/hosting", (req, res) => {
    res.render("footer/hosting", { page: 'footer-hosting' });
});

router.get("/company", (req, res) => {
    res.render("footer/company", { page: 'footer-company' });
});

router.get("/legal", (req, res) => {
    res.render("footer/legal", { page: 'footer-legal' });
});

// Individual footer link routes
router.get("/help", (req, res) => {
    res.render("footer/support", { page: 'footer-support' });
});

router.get("/safety", (req, res) => {
    res.render("footer/support", { page: 'footer-support' });
});

router.get("/cancellation", (req, res) => {
    res.render("footer/support", { page: 'footer-support' });
});

router.get("/accessibility", (req, res) => {
    res.render("footer/support", { page: 'footer-support' });
});

router.get("/disaster", (req, res) => {
    res.render("footer/community", { page: 'footer-community' });
});

router.get("/refugees", (req, res) => {
    res.render("footer/community", { page: 'footer-community' });
});

router.get("/combat", (req, res) => {
    res.render("footer/community", { page: 'footer-community' });
});

router.get("/host", (req, res) => {
    res.render("footer/hosting", { page: 'footer-hosting' });
});

router.get("/aircover", (req, res) => {
    res.render("footer/hosting", { page: 'footer-hosting' });
});

router.get("/resources", (req, res) => {
    res.render("footer/hosting", { page: 'footer-hosting' });
});

router.get("/newsroom", (req, res) => {
    res.render("footer/company", { page: 'footer-company' });
});

router.get("/careers", (req, res) => {
    res.render("footer/company", { page: 'footer-company' });
});

router.get("/investors", (req, res) => {
    res.render("footer/company", { page: 'footer-company' });
});

router.get("/privacy", (req, res) => {
    res.render("footer/legal", { page: 'footer-legal' });
});

router.get("/terms", (req, res) => {
    res.render("footer/legal", { page: 'footer-legal' });
});

router.get("/cookies", (req, res) => {
    res.render("footer/legal", { page: 'footer-legal' });
});

module.exports = router;
