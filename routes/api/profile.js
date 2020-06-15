const express = require("express");
const router = express.Router();
const request = require("request");
const config = require("config");
const { check, validationResult } = require("express-validator");
const auth = require("../../middleware/auth");
const Profile = require("../../model/Profile");
const User = require("../../model/User");

/*
@route - api/profile/me
@desc - get profile of logged in user
@access - private
*/
router.get("/me", auth, async (req, res) => {
  try {
    const profile = await Profile.findOne({ user: req.userId });
    if (!profile)
      return res.status(400).send({ error: "Profile doesn't exist for user" });
    res.json(profile);
  } catch (error) {
    res.status(500).send({ error: "Server error" });
  }
});

/*
@route - Post -api/profile/me
@desc - create profile of logged in user
@access - private
*/

router.post(
  "/",
  [
    auth,
    [
      check("designation", "designation is required.").not().isEmpty(),
      check("skills", "skills is required.").not().isEmpty(),
    ],
  ],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(422).json({ errors: errors.array() });
    }

    try {
      const {
        company,
        website,
        location,
        designation,
        skills,
        bio,
        githubusername,
        social: { youtube, twitter, facebook, linkedin, instagram } = {},
      } = req.body;

      const profile = {};
      profile.user = req.userId;
      profile.designation = designation;
      profile.skills = skills.split(",").map((item) => item.trim());

      if (company) profile.company = company;
      if (website) profile.website = website;
      if (location) profile.location = location;
      if (bio) profile.bio = bio;
      if (githubusername) profile.githubusername = githubusername;

      if (youtube) profile.social.youtube = youtube;
      if (twitter) profile.social.twitter = twitter;
      if (facebook) profile.social.facebook = facebook;
      if (linkedin) profile.social.linkedin = linkedin;
      if (instagram) profile.social.instagram = instagram;

      const existingUser = await Profile.findOne({ user: req.userId });
      if (existingUser) {
        const updatedPrifile = await Profile.findOneAndUpdate(
          { user: req.userId },
          profile,
          {
            new: true,
          }
        );
        if (!updatedPrifile) {
          return res.status(404).send({ error: "Something went wrong" });
        }
        return res.json(updatedPrifile);
      }
      const profileInstance = new Profile(profile);
      const response = await profileInstance.save();
      if (!response)
        return res.status(404).send({ errors: "Something went wrong" });
      res.json(response);
    } catch (err) {
      res.status(500).send({ error: "Internal Server error" });
    }
  }
);

/*
@route - GET - api/profile/
@desc - Get profiles of all users
@access - private
*/
router.get("/", auth, async (req, res) => {
  try {
    const profiles = await Profile.find().populate("user", ["name", "avatar"]);
    if (!profiles) {
      return res.send({ profiles: "No profile found" });
    }
    res.json(profiles);
  } catch (error) {
    res.status(500).send(error);
  }
});

/*
@route - GET - api/profile/:id
@desc - Get profile of user by userID
@access - private
*/
router.get("/:userid", auth, async (req, res) => {
  try {
    const profiles = await Profile.findOne({
      user: req.params.userid,
    }).populate("user", ["name", "avatar"]);
    if (!profiles) {
      return res.status(400).send({ errors: "No profile found" });
    }
    res.json(profiles);
  } catch (error) {
    if (error.kind == "ObjectId") {
      return res.status(400).send({ errors: "No profile found" });
    }
    res.status(500).send(error);
  }
});

/*
@route - DELETE - api/profile/
@desc - Delete profile and user details of loggedin user
@access - private
*/
router.delete("/", auth, async (req, res) => {
  try {
    const deletedprofile = await Profile.findOneAndRemove({
      user: req.userId,
    });
    const deletedUser = await User.findOneAndRemove({
      _id: req.userId,
    });

    if (!deletedprofile || !deletedUser) {
      return res.status(400).send({ errors: "Something went wrong" });
    }
    res.send({ message: "Profile deleted" });
  } catch (error) {
    res.status(500).send(error);
  }
});
module.exports = router;

/*
@route - Post - api/profile/experience
@desc - Add experience to profile of logged in user
@access - private
*/

router.post(
  "/experience",
  [
    auth,
    [
      check("title", "title is required.").not().isEmpty(),
      check("company", "company field is required.").not().isEmpty(),
      check("from", "from field is required.").not().isEmpty(),
    ],
  ],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(422).json({ errors: errors.array() });
    }

    try {
      const {
        title,
        company,
        location,
        from,
        to,
        current,
        description,
      } = req.body;

      const experienceObj = {};
      if (title) experienceObj.title = title;
      if (company) experienceObj.company = company;
      if (location) experienceObj.location = location;
      if (from) experienceObj.from = from;
      if (to) experienceObj.to = to;
      if (current) experienceObj.current = current;
      if (description) experienceObj.description = description;

      const profile = await Profile.findOne({ user: req.userId });
      if (!profile) {
        return res
          .status(404)
          .send({ error: "No profile found with this user" });
      }
      profile.experience.unshift(experienceObj);
      const updateExp = await profile.save();
      return res.json(updateExp);
    } catch (err) {
      res.status(500).send({ error: "Internal Server error" });
    }
  }
);

/*
@route - Post - api/profile/education
@desc - Add education to profile of logged in user
@access - private
*/

router.post(
  "/education",
  [
    auth,
    [
      check("school", "school is required.").not().isEmpty(),
      check("degree", "education degree is required.").not().isEmpty(),
      check("fieldofstudy", "fieldofstudy is required.").not().isEmpty(),
      check("from", "from  is required.").not().isEmpty(),
    ],
  ],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(422).json({ errors: errors.array() });
    }

    try {
      const {
        school,
        degree,
        fieldofstudy,
        from,
        to,
        current,
        description,
      } = req.body;

      const educationObj = {};
      if (school) educationObj.school = school;
      if (degree) educationObj.degree = degree;
      if (fieldofstudy) educationObj.fieldofstudy = fieldofstudy;
      if (from) educationObj.from = from;
      if (to) educationObj.to = to;
      if (current) educationObj.current = current;
      if (description) educationObj.description = description;

      const profile = await Profile.findOne({ user: req.userId });
      if (!profile) {
        return res
          .status(404)
          .send({ error: "No profile found with this user" });
      }
      profile.education.unshift(educationObj);
      const updateEducation = await profile.save();

      return res.json(updateEducation);
    } catch (err) {
      res.status(500).send({ error: "Internal Server error" });
    }
  }
);

/*
@route - DELETE - api/profile/experience/:id
@desc - Delete experience of loggedin user
@access - private
*/
router.delete("/experience/:expId", auth, async (req, res) => {
  try {
    const profile = await Profile.findOne({
      user: req.userId,
    });
    if (!profile) {
      return res.status(400).send({ errors: "No profile found" });
    }

    indexTobeRemoved = profile.experience.findIndex(
      (data) => data._id == req.params.expId
    );

    if (indexTobeRemoved === -1) {
      return res
        .status(400)
        .send({ errors: "Experience you are trying to delete doesn't exist" });
    }
    profile.experience.splice(indexTobeRemoved, 1);
    const success = await profile.save();
    if (!success) {
      return res.status(400).send({ errors: "Something went wrong" });
    }
    res.send({ message: "Successfully deleted" });
  } catch (error) {
    res.status(500).send(error);
  }
});

/*
@route - DELETE - api/profile/education/:id
@desc - Delete selected education details of loggedin user
@access - private
*/
router.delete("/education/:eduId", auth, async (req, res) => {
  try {
    const profile = await Profile.findOne({
      user: req.userId,
    });
    if (!profile) {
      return res.status(400).send({ errors: "No profile found" });
    }

    indexTobeRemoved = profile.education.findIndex(
      (data) => data._id == req.params.eduId
    );

    if (indexTobeRemoved === -1) {
      return res.status(400).send({
        errors: "Education details you are trying to delete doesn't exist",
      });
    }
    profile.education.splice(indexTobeRemoved, 1);
    const success = await profile.save();
    if (!success) {
      return res.status(400).send({ errors: "Something went wrong" });
    }
    res.send({ message: "Successfully deleted" });
  } catch (error) {
    res.status(500).send(error);
  }
});

/*
@route - api/profile/github/:username
@desc - Get user repo from github
@access - Public
*/

router.get("/github/:username", (req, res) => {
  try {
    const options = {
      uri: `https://api.github.com/users/${
        req.params.username
      }/repos?per_page=5&sort=created:asc&client_id=${config.get(
        "Client_ID"
      )}&client_secret=${config.get("ClientSecret")}`,
      method: "GET",
      headers: { "user-agent": "node.js" },
    };
    request(options, (error, response, body) => {
      if (error) return res.status(400).send(error);
      if (response.statusCode !== 200)
        return res.status(400).send({ errors: "No github profile found" });
      res.json(JSON.parse(body));
    });
  } catch (error) {
    res.status(500).send({ errors: "Server error" });
  }
});

module.exports = router;
