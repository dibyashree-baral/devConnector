const express = require("express");
const router = express.Router();
const { check, validationResult } = require("express-validator");
const auth = require("../../middleware/auth");
const Post = require("../../model/Post");
const User = require("../../model/User");

/*
@route - POST - api/posts
@desc - Post a post 
@access - private
*/
router.post(
  "/",
  [auth, [check("text", "Text is required").not().isEmpty()]],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(422).json({ errors: errors.array() });
    }
    try {
      const { text } = req.body;
      const user = await User.findById(req.userId);
      const postObj = {
        user: req.userId,
        name: user.name,
        text: text,
        avatar: user.avatar,
      };
      const post = new Post(postObj);
      const savedPost = await post.save();
      if (!savedPost) {
        res.status(400).send({ errors: "Something went wrong" });
      }
      res.send(savedPost);
    } catch (error) {
      res.status(500).send({ errors: "Server error" });
    }
  }
);

/*
@route - GET: api/posts
@desc - Get all the posts
@access - private
*/
router.get("/", auth, async (req, res) => {
  try {
    const posts = await Post.find().sort({ date: -1 });
    if (!posts) {
      return res.status(404).send({ errors: "No post found" });
    }
    res.send(posts);
  } catch (error) {
    if (error.kind("ObjectID"))
      return res.status(404).send({ errors: "No post found" });
    res.status(500).send({ errors: "Server error" });
  }
});

/*
@route - GET: api/posts/:id
@desc - Get posts by ID
@access - private
*/
router.get("/:id", auth, async (req, res) => {
  try {
    const post = await Post.findById(req.params.id);
    if (!post) {
      return res.status(404).send({ errors: "No post found" });
    }
    res.send(post);
  } catch (error) {
    if (error.kind("ObjectID"))
      return res.status(404).send({ errors: "No post found" });
    res.status(500).send({ errors: "Server error" });
  }
});

/*
@route - DELETE: api/posts/:id
@desc - DELETE post by ID
@access - private
*/
router.delete("/:id", auth, async (req, res) => {
  try {
    const post = await Post.findById(req.params.id);
    if (!post) {
      return res.status(404).send({ errors: "Post not found" });
    }
    if (req.userId !== post.user.toString())
      return res
        .status(404)
        .send({ errors: "User is not authorized to do this" });
    post.remove();
    res.send({ message: "Post deleted successfully!" });
  } catch (error) {
    if (error.kind("ObjectID"))
      return res.status(404).send({ errors: "No post found" });
    res.status(500).send({ errors: "Server error" });
  }
});

/*
@route - PUT - api/posts/like/:id
@desc - Like/Unlike a post 
@access - private
*/
router.put("/like/:id", auth, async (req, res) => {
  try {
    const post = await Post.findById(req.params.id);
    if (!post) {
      res.status(404).send({ errors: "Post not found" });
    }

    const findLikeIndex = post.likes.findIndex(
      (data) => data.user.toString() === req.userId.toString()
    );
    const findDislikeIndex = post.dislikes.findIndex(
      (data) => data.user.toString() === req.userId.toString()
    );
    const length = post.likes.length;
    if (findLikeIndex === -1) {
      post.likes.push({ user: req.userId });
      if (findDislikeIndex !== -1) post.dislikes.splice(findDislikeIndex, 1);
    } else {
      post.likes.splice(findLikeIndex, 1);
    }
    await post.save();
    post.likes.length > length
      ? res.send({ message: "Liked the meseage" })
      : res.send({ message: "Unliked the meseage" });
  } catch (error) {
    console.log(error);
    res.status(500).send({ errors: "Server error" });
  }
});

/*
@route - PUT - api/posts/dislike/:id
@desc - Dislike/revert dislike a post 
@access - private
*/
router.put("/dislike/:id", auth, async (req, res) => {
  try {
    const post = await Post.findById(req.params.id);
    if (!post) {
      res.status(404).send({ errors: "Post not found" });
    }

    const findLikeIndex = post.likes.findIndex(
      (data) => data.user.toString() === req.userId.toString()
    );
    const findDislikeIndex = post.dislikes.findIndex(
      (data) => data.user.toString() === req.userId.toString()
    );
    const length = post.dislikes.length;
    if (findDislikeIndex === -1) {
      post.dislikes.push({ user: req.userId });
      if (findLikeIndex !== -1) post.likes.splice(findLikeIndex, 1);
    } else {
      post.dislikes.splice(findDislikeIndex, 1);
    }
    await post.save();
    post.dislikes.length > length
      ? res.send({ message: "Disliked the meseage" })
      : res.send({ message: "reverted the dislike" });
  } catch (error) {
    console.log(error);
    res.status(500).send({ errors: "Server error" });
  }
});

/*
@route - POST - api/posts/comments/:postId
@desc - add comment to a post 
@access - private
*/
router.post(
  "/comments/:postId",
  [auth, [check("text", "Text is required").not().isEmpty()]],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(422).json({ errors: errors.array() });
    }
    try {
      const { text } = req.body;
      const user = await User.findById(req.userId);
      const commentObj = {
        user: req.userId,
        name: user.name,
        text: text,
        avatar: user.avatar,
      };
      const post = await Post.findById(req.params.postId);

      if (!post) {
        res.status(400).send({ errors: "No post found" });
      }
      post.comments.unshift(commentObj);
      const savedComment = await post.save();
      res.send(savedComment);
    } catch (error) {
      res.status(500).send({ errors: "Server error" });
    }
  }
);

/*
@route - DELETE: api/posts/comments/:postId/:commentId
@desc - DELETE comment by ID
@access - private
*/
router.delete("/comments/:postId/:commentId", auth, async (req, res) => {
  try {
    const post = await Post.findById(req.params.postId);
    if (!post) {
      return res.status(404).send({ errors: "Post not found" });
    }
    const findComment = post.comments.filter(
      (comments) => comments._id.toString() === req.params.commentId
    );
    if (findComment.length < 1)
      return res.status(404).send({ errors: "Comment not found" });
    console.log(findComment[0].user);
    const isPermittedUser =
      findComment[0].user.toString() === req.userId.toString();
    if (!isPermittedUser)
      return res
        .status(404)
        .send({ errors: "User is not authorized to do this" });
    const findCommentIndex = post.comments.findIndex(
      (comments) =>
        comments._id.toString() === req.params.commentId &&
        comments.user.toString() === req.userId.toString()
    );
    post.comments.splice(findCommentIndex, 1);
    await post.save();
    res.send({ message: "Comment deleted successfully!" });
  } catch (error) {
    console.log(error);
    // if (error.kind("ObjectID"))
    //   return res.status(404).send({ errors: "No post found" });
    res.status(500).send({ errors: "Server error" });
  }
});

module.exports = router;
