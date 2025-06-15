import User from "../models/User.js";
import FriendRequest from "../models/FriendRequest.js";

export async function getRecommendedUsers(req, res) {
    try{
        const currentUserId = req.user.id;
        const currentUser = req.user;

        const recommendedUsers = await User.find({
            $and:[
                {_id: {$ne: currentUserId}},
                {$id: {$nin: currentUser.friends}},
                {isOnboarded: true},
            ]
        })
        res.status(200).json(recommendedUsers);
    }catch(err){
        console.error("Error in getRecommendedUsers controller", err.message);
        res.status(500).json({message: "Internal server error"});
    }
}

export async function getMyFriends(req, res) {
    try{
        const user = await User.findById(req.user.id).select("friends")
        .populate("friends", "fullName profilePicture nativeLanguage learningLanguage");

        res.status(200).json(user.friends);

    }catch(err){
        console.error("Error in getMyFriends controller", err.message);
        res.status(500).json({message: "Internal server error"});
    }
}

export async function sendFriendRequest(req, res) {
    try{
        const myId = req.user.id;
        const {id:recipientId} = req.params;

        if(myId === recipientId){
            return res.status(400).json({message: "You cannot send a friend request to yourself"});
        }

        const recipient = await User.findById(recipientId);
        if(!recipient){
            return res.status(404).json({message: "Recipient not found"});
        }

        if (recipient.friends.includes(myId)){
            return res.status(400).json({message: "You are already friends with this user"});
        }

        const existingRequest = await FriendRequest.findOne({
            $or: [
                { sender: myId, recipient: recipientId },
                { sender: recipientId, recipient: myId }
            ]
        });
        if (existingRequest) {
            return res.status(400).json({ message: "A friend request already exists between you and this user" });
        }

        const friendRequest = await FriendRequest.create({
            sender: myId,
            recipient: recipientId
        });

        res.status(201).json(friendRequest);

    }catch(err){
        console.error("Error in sendFriendRequest controller", err.message);
        res.status(500).json({message: "Internal server error"});
    }
}

export async function acceptFriendRequest(req, res){
    try {
        const {id:requestId} = req.params;
        const friendRequest = await FriendRequest.findById(requestId);

        if(!friendRequest){
            return res.status(404).json({message: "Friend request not found"});
        }
        if (friendRequest.recipient.toString() !== req.user.id){
            return res.status(403).json({message: "You are not authorized to accept this request"})
        }

        friendRequest.status = "accepted";
        await friendRequest.save()

        await User.findByIdAndUpdate(friendRequest.sender,{
            $addToSet:{friends: friendRequest.recipient}
        })

        await User.findByIdAndUpdate(friendRequest.recipient,{
            $addToSet:{friends: friendRequest.sender}
        })

        res.status(200).json({message: "Friend request accepted"})
    }catch(err){
        console.log("Error in acceptFriendRequest controller", err.message);
        res.status(500).json({message: "Internal server error"});
    }
}

export async function getFriendRequest(req, res){
    try {
        const incomingReqs = await FriendRequest.find({
            recipient: req.user.id,
            status: "pending",
        }).populate("sender", "fullname profilePicture nativeLanguage learningLanguage")

        const acceptedReqs = await FriendRequest.find({
            sender: req.user.id,
            status: "accepted",
        }).populate("recipient", "fullname profilePicture")

        res.status(200).json(incomingReqs, acceptedReqs);
    }catch(err){
        console.log("Error in getFriendRequest controller", err.message);
        res.status(500).json({message: "Internal server error"});
    }
}

export async function getOutgoingFriendReqs(req, res){
    try {
        const outgoingRequests = await FriendRequest.find({
            sender: req.user.id,
            status: "pending",
        }).populate("recipient", "fullName profilePicture nativeLanguage learningLanguage")

        res.status(200).json(outgoingRequests);
    }catch(err){
        console.log("Error in getOutgoingFriendReqs controller", err.message);
        res.status(500).json({message: "Internal server error"});
    }
}