import Map "mo:core/Map";
import Iter "mo:core/Iter";
import Set "mo:core/Set";
import Time "mo:core/Time";
import Array "mo:core/Array";
import Order "mo:core/Order";
import Text "mo:core/Text";
import Runtime "mo:core/Runtime";
import Principal "mo:core/Principal";
import Nat "mo:core/Nat";
import MixinAuthorization "authorization/MixinAuthorization";
import AccessControl "authorization/access-control";

actor {
  let accessControlState = AccessControl.initState();
  include MixinAuthorization(accessControlState);

  // Hardcoded superadmin principal -- always gets admin role on registration
  let superadminPrincipal : Principal = Principal.fromText("ci3hz-xset5-ahrcc-nhtdc-kfnzc-34wqe-e2yzj-qk2gl-ygiwy-oc5j5-2ae");

  // User Profile Type
  public type UserProfile = {
    name : Text;
  };

  type Post = {
    id : Nat;
    title : Text;
    content : Text;
    author : Principal;
    authorName : Text;
    createdAt : Int;
    updatedAt : Int;
    published : Bool;
  };

  type Comment = {
    id : Nat;
    postId : Nat;
    author : Principal;
    authorName : Text;
    content : Text;
    createdAt : Int;
  };

  type NotificationType = {
    #comment;
    #like;
    #follow;
  };

  type Notification = {
    id : Nat;
    recipient : Principal;
    notificationType : NotificationType;
    referenceId : Nat;
    message : Text;
    read : Bool;
    createdAt : Int;
  };

  var nextPostId = 1;
  var nextCommentId = 1;
  var nextNotificationId = 1;

  let posts = Map.empty<Nat, Post>();
  let comments = Map.empty<Nat, Comment>();
  let likes = Map.empty<Nat, Set.Set<Principal>>();
  let followers = Map.empty<Principal, Set.Set<Principal>>();
  let following = Map.empty<Principal, Set.Set<Principal>>();
  let notifications = Map.empty<Nat, Notification>();
  let userProfiles = Map.empty<Principal, UserProfile>();

  // Register caller. If caller is the hardcoded superadmin, always assign admin role.
  // Otherwise, the first registering user becomes admin (claimAdminIfFirst logic).
  // Safe to call multiple times -- subsequent calls are no-ops.
  public shared ({ caller }) func registerOrClaimAdmin() : async AccessControl.UserRole {
    if (caller.isAnonymous()) {
      Runtime.trap("Anonymous callers cannot register");
    };

    // Hardcoded superadmin always gets admin role
    if (caller == superadminPrincipal) {
      accessControlState.userRoles.add(caller, #admin);
      accessControlState.adminAssigned := true;
      return #admin;
    };

    // Already registered -- return existing role
    switch (accessControlState.userRoles.get(caller)) {
      case (?role) { return role };
      case (null) {};
    };

    // First ever non-superadmin user becomes admin; everyone else becomes a regular user
    if (not accessControlState.adminAssigned) {
      accessControlState.userRoles.add(caller, #admin);
      accessControlState.adminAssigned := true;
      #admin;
    } else {
      accessControlState.userRoles.add(caller, #user);
      #user;
    };
  };

  // Helper function to create notifications
  func createNotification(
    recipient : Principal,
    notificationType : NotificationType,
    referenceId : Nat,
    message : Text,
  ) {
    let notificationId = nextNotificationId;
    nextNotificationId += 1;

    let notification = {
      id = notificationId;
      recipient;
      notificationType;
      referenceId;
      message;
      read = false;
      createdAt = Time.now();
    };

    notifications.add(notificationId, notification);
  };

  // User Profile Functions
  public query ({ caller }) func getCallerUserProfile() : async ?UserProfile {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can view profiles");
    };
    userProfiles.get(caller);
  };

  public query ({ caller }) func getUserProfile(user : Principal) : async ?UserProfile {
    if (caller != user and not AccessControl.isAdmin(accessControlState, caller)) {
      Runtime.trap("Unauthorized: Can only view your own profile");
    };
    userProfiles.get(user);
  };

  public shared ({ caller }) func saveCallerUserProfile(profile : UserProfile) : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can save profiles");
    };
    userProfiles.add(caller, profile);
  };

  // Blog Post Functions
  public shared ({ caller }) func createPost(
    title : Text,
    content : Text,
    authorName : Text,
    published : Bool,
  ) : async Nat {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only authenticated users can create posts");
    };

    let postId = nextPostId;
    nextPostId += 1;

    let post = {
      id = postId;
      title;
      content;
      author = caller;
      authorName;
      createdAt = Time.now();
      updatedAt = Time.now();
      published;
    };

    posts.add(postId, post);
    postId;
  };

  public shared ({ caller }) func updatePost(
    id : Nat,
    title : Text,
    content : Text,
    published : Bool,
  ) : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only authenticated users can update posts");
    };

    switch (posts.get(id)) {
      case (null) {
        Runtime.trap("Post not found");
      };
      case (?post) {
        if (post.author != caller and not AccessControl.isAdmin(accessControlState, caller)) {
          Runtime.trap("Unauthorized: Only post author or admin can edit posts");
        };

        let updatedPost = {
          id = post.id;
          title;
          content;
          author = post.author;
          authorName = post.authorName;
          createdAt = post.createdAt;
          updatedAt = Time.now();
          published;
        };

        posts.add(id, updatedPost);
      };
    };
  };

  public shared ({ caller }) func deletePost(id : Nat) : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only authenticated users can delete posts");
    };

    switch (posts.get(id)) {
      case (null) {
        Runtime.trap("Post not found");
      };
      case (?post) {
        if (post.author != caller and not AccessControl.isAdmin(accessControlState, caller)) {
          Runtime.trap("Unauthorized: Only post author or admin can delete posts");
        };

        posts.remove(id);
      };
    };
  };

  public query ({ caller }) func getPost(id : Nat) : async ?Post {
    switch (posts.get(id)) {
      case (null) { null };
      case (?post) {
        if (post.published or post.author == caller or AccessControl.isAdmin(accessControlState, caller)) {
          ?post;
        } else {
          null;
        };
      };
    };
  };

  public query ({ caller }) func getAllPublishedPosts() : async [Post] {
    let publishedPosts = posts.values().toArray().filter(
      func(p : Post) : Bool { p.published }
    );
    publishedPosts.sort<Post>(
      func(a : Post, b : Post) : Order.Order {
        Nat.compare(a.id, b.id);
      }
    );
  };

  // Comment Functions
  public shared ({ caller }) func addComment(
    postId : Nat,
    authorName : Text,
    content : Text,
  ) : async Nat {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only authenticated users can comment");
    };

    switch (posts.get(postId)) {
      case (null) {
        Runtime.trap("Post not found");
      };
      case (?post) {
        let commentId = nextCommentId;
        nextCommentId += 1;

        let comment = {
          id = commentId;
          postId;
          author = caller;
          authorName;
          content;
          createdAt = Time.now();
        };

        comments.add(commentId, comment);

        if (post.author != caller) {
          createNotification(
            post.author,
            #comment,
            commentId,
            authorName # " commented on your post: " # post.title,
          );
        };

        commentId;
      };
    };
  };

  public shared ({ caller }) func deleteComment(id : Nat) : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only authenticated users can delete comments");
    };

    switch (comments.get(id)) {
      case (null) {
        Runtime.trap("Comment not found");
      };
      case (?comment) {
        if (comment.author != caller and not AccessControl.isAdmin(accessControlState, caller)) {
          Runtime.trap("Unauthorized: Only comment author or admin can delete comments");
        };

        comments.remove(id);
      };
    };
  };

  public query ({ caller }) func getPostComments(postId : Nat) : async [Comment] {
    comments.values().toArray().filter<Comment>(
      func(c : Comment) : Bool { c.postId == postId }
    );
  };

  // Like Functions
  public shared ({ caller }) func likePost(postId : Nat) : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only authenticated users can like posts");
    };

    switch (posts.get(postId)) {
      case (null) {
        Runtime.trap("Post not found");
      };
      case (?post) {
        let likeSet = switch (likes.get(postId)) {
          case (null) { Set.empty<Principal>() };
          case (?s) { s };
        };

        if (not likeSet.contains(caller)) {
          likeSet.add(caller);
          likes.add(postId, likeSet);

          if (post.author != caller) {
            switch (userProfiles.get(caller)) {
              case (?profile) {
                createNotification(
                  post.author,
                  #like,
                  postId,
                  profile.name # " liked your post: " # post.title,
                );
              };
              case (null) {
                createNotification(
                  post.author,
                  #like,
                  postId,
                  "Someone liked your post: " # post.title,
                );
              };
            };
          };
        };
      };
    };
  };

  public shared ({ caller }) func unlikePost(postId : Nat) : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only authenticated users can unlike posts");
    };

    switch (likes.get(postId)) {
      case (null) {};
      case (?likeSet) {
        likeSet.remove(caller);
        likes.add(postId, likeSet);
      };
    };
  };

  public query ({ caller }) func getPostLikes(postId : Nat) : async Nat {
    switch (likes.get(postId)) {
      case (null) { 0 };
      case (?likeSet) { likeSet.size() };
    };
  };

  public query ({ caller }) func hasLikedPost(postId : Nat) : async Bool {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      return false;
    };

    switch (likes.get(postId)) {
      case (null) { false };
      case (?likeSet) { likeSet.contains(caller) };
    };
  };

  // Follow Functions
  public shared ({ caller }) func followUser(user : Principal) : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only authenticated users can follow others");
    };

    if (caller == user) {
      Runtime.trap("Cannot follow yourself");
    };

    let followerSet = switch (followers.get(user)) {
      case (null) { Set.empty<Principal>() };
      case (?s) { s };
    };

    if (not followerSet.contains(caller)) {
      followerSet.add(caller);
      followers.add(user, followerSet);

      let followingSet = switch (following.get(caller)) {
        case (null) { Set.empty<Principal>() };
        case (?s) { s };
      };
      followingSet.add(user);
      following.add(caller, followingSet);

      switch (userProfiles.get(caller)) {
        case (?profile) {
          createNotification(
            user,
            #follow,
            0,
            profile.name # " started following you",
          );
        };
        case (null) {
          createNotification(
            user,
            #follow,
            0,
            "Someone started following you",
          );
        };
      };
    };
  };

  public shared ({ caller }) func unfollowUser(user : Principal) : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only authenticated users can unfollow others");
    };

    switch (followers.get(user)) {
      case (null) {};
      case (?followerSet) {
        followerSet.remove(caller);
        followers.add(user, followerSet);
      };
    };
  };

  public query ({ caller }) func getUserFollowers(user : Principal) : async [Principal] {
    switch (followers.get(user)) {
      case (null) { [] };
      case (?followerSet) { followerSet.values().toArray() };
    };
  };

  public query ({ caller }) func getUserFollowing(user : Principal) : async [Principal] {
    switch (following.get(user)) {
      case (null) { [] };
      case (?followingSet) { followingSet.values().toArray() };
    };
  };

  // Notification Functions
  public query ({ caller }) func getUserNotifications() : async [Notification] {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only authenticated users can view notifications");
    };

    notifications.values().toArray().filter<Notification>(
      func(n : Notification) : Bool { n.recipient == caller }
    );
  };

  public shared ({ caller }) func markNotificationAsRead(id : Nat) : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only authenticated users can mark notifications as read");
    };

    switch (notifications.get(id)) {
      case (null) {
        Runtime.trap("Notification not found");
      };
      case (?notification) {
        if (notification.recipient != caller) {
          Runtime.trap("Unauthorized: Can only mark your own notifications as read");
        };

        let updatedNotification = {
          id = notification.id;
          recipient = notification.recipient;
          notificationType = notification.notificationType;
          referenceId = notification.referenceId;
          message = notification.message;
          read = true;
          createdAt = notification.createdAt;
        };

        notifications.add(id, updatedNotification);
      };
    };
  };

  public shared ({ caller }) func markAllNotificationsAsRead() : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only authenticated users can mark notifications as read");
    };

    for ((id, notification) in notifications.entries()) {
      if (notification.recipient == caller and not notification.read) {
        let updatedNotification = {
          id = notification.id;
          recipient = notification.recipient;
          notificationType = notification.notificationType;
          referenceId = notification.referenceId;
          message = notification.message;
          read = true;
          createdAt = notification.createdAt;
        };

        notifications.add(id, updatedNotification);
      };
    };
  };
};
