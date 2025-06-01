import React, { useEffect, useState } from "react";
import {Box} from "@chakra-ui/react";
import {ChatState} from "../Context/ChatProvider";
import SideDrawer from "../components/extras/SideDrawer";
import MyChats from "../components/MyChats";
import ChatBox from "../components/ChatBox";

const ChatPage = () => {
  const {user} = ChatState();
  return (
	<div style={{width: "100%"}}>
		{user && <SideDrawer/>}
		<Box display="flex" justifyContent="space-between" width="100%" height="91.5vh" padding="10px" flexWrap="nowrap">
			{user && <MyChats/>} 
			{user && <ChatBox/>}
		</Box>
	</div>
  )
}

export default ChatPage;