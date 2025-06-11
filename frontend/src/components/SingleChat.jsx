import React from "react";
import { ChatState } from "../Context/ChatProvider";
import { Box, IconButton, Text } from "@chakra-ui/react";
import { ArrowBackIcon } from "@chakra-ui/icons";
import { getSender, getSenderFull } from "../config/ChatLogics";
import ProfileModal from "./extras/ProfileModal";

const SingleChat = ({ fetchAgain, setFetchAgain}) => {
  const { user, selectedChat, setSelectedChat } = ChatState();

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
      {/* <UpdateGroupChatModal
        fetchAgain={fetchAgain}
        setFetchAgain={setFetchAgain}
      /> */}
      </>)}
    </Box>
  </>): 
  (<Box display="flex" alignItems="center" justifyContent="center" height="100%">
    <Text fontSize="3xl" pb={3} fontFamily="Work sans">
      Click on a user to start chatting
    </Text>
  </Box>)}</>);
}

export default SingleChat;