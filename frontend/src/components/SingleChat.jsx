import React, { useState, useEffect } from "react";
import { ChatState } from "../Context/ChatProvider";
import { Box, FormControl, IconButton, Input, Spinner, Text, useToast } from "@chakra-ui/react";
import { ArrowBackIcon } from "@chakra-ui/icons";
import { getSender, getSenderFull } from "../config/ChatLogics";
import ProfileModal from "./extras/ProfileModal";
import UpdateGroupChatModal from "./extras/UpdateGroupChatModal";
import axios from "axios";
import "./styles.css";
import ScrollableChat from "./ScrollableChat";
import io from "socket.io-client";
import Lottie from "react-lottie";
import animationData from "../animations/typing.json";

const ENDPOINT = process.env.BACKEND_PORT;
let socket, selectedChatCompare;

const SingleChat = ({ fetchAgain, setFetchAgain}) => {
  const [socketConnected, setSocketConnected] = useState(false);
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(false);
  const [newMessage, setNewMessage] = useState();
  const [typing, setTyping] = useState(false);
  const [isTyping, setIsTyping] = useState(false);

  const { user, selectedChat, setSelectedChat } = ChatState();
  const toast = useToast();

  const defaultOptions = {
    loop: true,
    autoplay: true,
    animationData, animationData,
    rendererSettings: {
      preserveAspectRatio: "xMidYMid slice",
    },
  }

  useEffect(() => {
    socket = io(ENDPOINT);
    socket.emit("setup",user);
    socket.on("connected", () => setSocketConnected(true));
    socket.on("typing", () => setIsTyping(true));
    socket.on("stop typing", () => setIsTyping(false));
  },[]);

  useEffect(() => {
    fetchMessages();

    selectedChatCompare = selectedChat;
  }, [selectedChat]);

  useEffect(() => {
    
    socket.on("message recieved", (newMessageRecieved) => {
      
      if(!selectedChatCompare || selectedChatCompare.id !== newMessageRecieved.chat.id){
        // give
      } else {
        
        setMessages([...messages, newMessageRecieved]);
      }
    });
  });


  const fetchMessages = async () => {
    if(!selectedChat) return;
    try {
      setLoading(true);
      const {data} = await axios.get(`/api/message/${selectedChat.id}`,{withCredentials: true});
      setMessages(data);
      setLoading(false);
      socket.emit("join chat", selectedChat.id);
    } catch (error) {
      toast({
				title: "Error Occured!",
				description: "Failed to load the Message",
				status: "error",
				duration: 5000,
				isClosable: true,
				position: "bottom",
			});

    }
    

  };

  const sendMessage = async (event) => {
    if (event.key === "Enter" && newMessage) {
      socket.emit("stop typing", selectedChat.id);
      try {
        setNewMessage("");
        const {data} = await axios.post("/api/message", {
          content: newMessage,
          chatId: selectedChat.id,
        }, {headers : {"Content-Type" : "application/json", withCredentials: true}});
       
        socket.emit("new message", data);
        setMessages([...messages, data]);
      } catch (error) {
        toast({
				title: "Error Occured!",
				description: "Failed to send the Message",
				status: "error",
				duration: 5000,
				isClosable: true,
				position: "bottom",
			});
      }
    }
  };
  const typingHandler = (e) => {
    setNewMessage(e.target.value);
    
    if(!socketConnected) return;

    if(!typing) {
      setTyping(true);
      socket.emit("typing", selectedChat.id);
    }
    let lastTypingTime = new Date().getTime();
    let timerLength = 3000;
    setTimeout(() => {
      let timeNow = new Date().getTime();
      let timeDiff = timeNow - lastTypingTime;

      if(timeDiff >= timerLength && typing) {
        socket.emit("stop typing", selectedChat.id);
        setTyping(false);
      }
    }, timerLength);

  };




  return (<>{selectedChat ? (
  <>
    <Box
      fontSize={{base: "28px", md: "30px"}}
      pb={3}
      px={2}
      w="100%"
      fontFamily="Work sans"
      display="flex"
      justifyContent={{base: "space-between"}}
      alignItems="center"
      width="100%"
    >
      <IconButton
        display={{ base: "flex", md: "none"}}
        icon={<ArrowBackIcon/>}
        onClick={() => setSelectedChat("")}
        
      />
      {!selectedChat.isgroupchat ? (
        <>{getSender(user,selectedChat.users)}
        <ProfileModal user={getSenderFull(user,selectedChat.users)}/>
        </>) : 
      (<>{selectedChat.chatname.toUpperCase()}
      <UpdateGroupChatModal
        fetchAgain={fetchAgain}
        setFetchAgain={setFetchAgain}
        fetchMessages={fetchMessages}
      />
      </>)}
    </Box>
    <Box
      display="flex"
      flexDir="column"
      justifyContent="flex-end"
      p={3}
      bg="#E8E8E8"
      w="100%"
      h="100%"
      borderRadius="lg"
      overflowY="hidden"
    >
      {loading ? (<Spinner size="xl" w={20} h={20} alignSelf="center" margin="auto"/>) : (
        <div className="messages">
          <ScrollableChat messages={messages}/>
        </div>
      )}
      <FormControl onKeyDown={sendMessage} isRequired mt={3}>
        {isTyping?<div>
          <Lottie
            options={defaultOptions}
            width={70}
            style={{ marginBottom: 15, marginLeft: 0}}
          />
        </div> : <></>}
        <Input variant="filled" bg="#E0E0E0" placeholder="Enter a message.." onChange={typingHandler} value={newMessage}/>
      </FormControl>
    </Box>
  </>): 
  (<Box display="flex" alignItems="center" justifyContent="center" height="100%">
    <Text fontSize="3xl" pb={3} fontFamily="Work sans">
      Click on a user to start chatting
    </Text>
  </Box>)}</>);
}

export default SingleChat;