const User = require("../models/user");


module.exports.renderSignupForm = (req, res) => {
    res.render("users/signup.ejs");
};

module.exports.signup = async (req, res, next) => {
    try{
        console.log('🔍 === SIGNUP PROCESS START ===');
        console.log('📋 Request body:', req.body);
        
        let { username, email, password, userType, role, firstName, lastName } = req.body;
        
        // Validate userType
        if (!userType || !['user', 'admin'].includes(userType)) {
            console.error('❌ Invalid userType:', userType);
            req.flash("error", "Please select a valid user type.");
            return res.redirect("/signup");
        }

        // Validate role
        if (!role || !['user', 'admin', 'super_admin', 'moderator'].includes(role)) {
            console.error('❌ Invalid role:', role);
            req.flash("error", "Please select a valid role.");
            return res.redirect("/signup");
        }

        // Ensure role matches userType for consistency
        if (userType === 'user' && !['user'].includes(role)) {
            console.error('❌ Role mismatch for user type:', userType, role);
            req.flash("error", "Invalid role for user account type.");
            return res.redirect("/signup");
        }

        if (userType === 'admin' && !['admin', 'super_admin', 'moderator'].includes(role)) {
            console.error('❌ Role mismatch for admin type:', userType, role);
            req.flash("error", "Invalid role for admin account type.");
            return res.redirect("/signup");
        }
        
        console.log('✅ Validation passed:', { userType, role, email, username });
        
        const newUser = new User({ 
            email, 
            username, 
            userType,
            role,
            firstName: firstName || '',
            lastName: lastName || '',
            isActive: true
        });
        
        const registeredUser = await User.register(newUser, password);
        console.log('✅ User registered successfully:', {
            id: registeredUser._id,
            email: registeredUser.email,
            username: registeredUser.username,
            userType: registeredUser.userType,
            role: registeredUser.role
        });
        
        req.login(registeredUser, (err)=>{
            if (err) {
                console.error('❌ Login after signup failed:', err);
                return next(err);
            }
            
            console.log('✅ User logged in after signup');
            
            // Redirect based on user type and role
            if (userType === 'admin') {
                req.flash("success", `Welcome ${role.charAt(0).toUpperCase() + role.slice(1)}! Your account has been created successfully.`);
                res.redirect("/admin/dashboard");
            } else {
                req.flash("success", "Welcome to Airbnb Clone! Your account has been created successfully.");
                res.redirect("/listings");
            }
        });
        
    }catch (e) {
        console.error('❌ Signup error:', e);
        req.flash("error", e.message);
        res.redirect("/signup");
    }
};

module.exports.renderLoginForm = (req, res) => {
    res.render("users/login.ejs");
};

module.exports.login = async (req, res) => {
    console.log('🔍 === LOGIN CONTROLLER CALLED ===');
    console.log('👤 Logged in user:', {
        id: req.user._id,
        email: req.user.email,
        username: req.user.username,
        userType: req.user.userType,
        role: req.user.role
    });
    
    // Update last login timestamp
    try {
        req.user.lastLogin = new Date();
        await req.user.save();
        console.log('✅ Last login timestamp updated');
    } catch (error) {
        console.error('❌ Failed to update last login:', error);
    }
    
    // Check if user is admin and redirect accordingly
    if (req.user && req.user.userType === 'admin') {
        req.flash("success", `Welcome back, ${req.user.role.charAt(0).toUpperCase() + req.user.role.slice(1)}!`);
        let redirectUrl = res.locals.redirectUrl || "/admin/dashboard";
        console.log('🔄 Redirecting admin to:', redirectUrl);
        res.redirect(redirectUrl);
    } else {
        req.flash("success", "Welcome back to UrbanNest!");
        let redirectUrl = res.locals.redirectUrl || "/listings";
        console.log('🔄 Redirecting user to:', redirectUrl);
        res.redirect(redirectUrl);
    }
};

module.exports.logout = (req, res, next)=>{
    req.logout((err)=>{
        if (err){
            return next(err);
        }
        req.flash("success", "You are logged out!");
        res.redirect("/listings");
    });
};

// Homepage redirect with logout
module.exports.homepageLogout = (req, res) => {
    console.log('🏠 === HOMEPAGE LOGOUT ===');
    console.log('👤 Current user:', req.user ? {
        id: req.user._id,
        email: req.user.email,
        userType: req.user.userType
    } : 'No user');
    
    req.logout((err) => {
        if (err) {
            console.error('❌ Logout error:', err);
            return res.redirect("/listings");
        }
        console.log('✅ User logged out successfully');
        req.flash("success", "You have been logged out and redirected to homepage!");
        res.redirect("/");
    });
};
