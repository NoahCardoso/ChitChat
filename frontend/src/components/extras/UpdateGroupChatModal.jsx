import { ViewIcon } from "@chakra-ui/icons";
import { Button, ModalContent, ModalFooter, ModalHeader, ModalOverlay, useDisclosure, Modal, ModalBody, ModalCloseButton, IconButton, useToast, Box, FormControl, Input, Spinner } from "@chakra-ui/react";
import React, { useState } from 'react'
import { ChatState } from "../../Context/ChatProvider";
import UserBadgeItem from "../UserAvatar/UserBadgeItem";
import axios from "axios";
import UserListItem from "../UserAvatar/UserListItem";

const UpdateGroupChatModal = ({ fetchAgain, setFetchAgain, fetchMessages }) => {
  const  { isOpen, onOpen, onClose} = useDisclosure();
  const [groupChatName, setGroupChatName] = useState();
  const [search, setSearch] = useState("");
  const [searchResult, setSearchResult] = useState([]);
  const [loading, setLoading] = useState(false);
  const [renameLoading, setRenameLoading] = useState(false);

  const toast = useToast();

  const { selectedChat, setSelectedChat, user} = ChatState();

  const handleRemove = async(otherUser) => {
    if (selectedChat.groupadmin !== user.id && otherUser.id !== user.id) {
      toast({
        title: "Only admins can remove someone!",
				status: "error",
				duration: 5000,
				isClosable: true,
				position: "bottom",
      });
      return;
    }
    try {
      setLoading(true);
      const {data} = await axios.put("/api/chat/group-remove",{chatId: selectedChat.id, userId: otherUser.id,}, {withCredentials: true});
      otherUser.id === user.id ? setSelectedChat() : setSelectedChat(data);
      setFetchAgain(!fetchAgain);
      fetchMessages();
      setLoading(false);
    } catch (error) {
      toast({
				title: "Error Occured!",
				description: error.response.data.message,
				status: "error",
				duration: 5000,
				isClosable: true,
				position: "bottom",
			});
      setLoading(false);
    }

  };

  const handleRename = async () => {
    if(!groupChatName) return;

    try {
      setRenameLoading(true);

      const {data} = await axios.put("/api/chat/group-rename",{chatName: groupChatName, chatId: selectedChat.id}, {withCredentials: true});

      setSelectedChat(data);
      setFetchAgain(!fetchAgain);
      
    } catch (err){
      toast({
        title: "Error Occured!",
        description: err.response.data.message,
        status: "error",
        duration: 5000,
        isClosable: true,
        position: "bottom",
      });

    }
    setRenameLoading(false);
    setGroupChatName("");

  };

  const handleSearch = async(query) => {
    setSearch(query);
		if (!query) {
			return;
		}
		try {
			setLoading(true);
			const { data } = await axios.get(`/api/user?search=${search}`, {
				withCredentials: true,
			});
			setSearchResult(data);
			setLoading(false);
			
			
		} catch(err) {
			toast({
				title: "Error Occured!",
				description: "Failed to load the Search Results",
				status: "error",
				duration: 5000,
				isClosable: true,
				position: "bottom-left",
			});
		}
    setLoading(false);
	};

  const handleAddUser = async (otherUser) => {
    if (selectedChat.users.find(u => u.id === otherUser.id)) {
      toast({
        title: "User Already in group!",
				status: "error",
				duration: 5000,
				isClosable: true,
				position: "bottom",
      });
      return;
    }

    if (selectedChat.groupadmin !== user.id) {
      toast({
        title: "Only admins can add someone!",
				status: "error",
				duration: 5000,
				isClosable: true,
				position: "bottom",
      });
      return;
    }

    try {
      setLoading(true);
			const { data } = await axios.put(`/api/chat/group-add`, {chatId: selectedChat.id, userId: otherUser.id}, {
				withCredentials: true,
			});
			setSelectedChat(data);
      setFetchAgain(!fetchAgain);
			setLoading(false);
    } catch (error) {
      
    }
  };

  return (
    <>
      <IconButton onClick={onOpen} display={{base: "flex"}} icon={<ViewIcon/>}/>

      <Modal isOpen={isOpen} onClose={onClose} isCentered>
        <ModalOverlay />
        <ModalContent>
          <ModalHeader
            fontSize="35px"
            fontFamily="Work sans"
            display="flex"
            justifyContent="center"
          >{selectedChat.chatname}</ModalHeader>
          <ModalCloseButton />
          <ModalBody>
            <Box
              w="100%"
              display="flex"
              flexWrap="wrap"
              pb={3}
            >
              {selectedChat.users.map((u) => (
                <UserBadgeItem
                  key={user.id}
                  user={u}
                  handleFunction={() => handleRemove(u)}
                />))}
            </Box>
            <FormControl display="flex">
              <Input
                placeholder="Chat Name"
                mb={3}
                value={groupChatName}
                onChange={(e) => setGroupChatName(e.target.value)}
              />
              <Button
                variant="solid"
                colorScheme="teal"
                ml={1}
                isLoading={renameLoading}
                onClick={handleRename}
              >
                Update
              </Button>
            </FormControl>
            <FormControl>
              <Input
                placeholder="Add User to group"
                mb={1}
                onChange={(e) => handleSearch(e.target.value)}
              />
            </FormControl>
            {loading ? (<Spinner size="lg"/>) : (searchResult?.map((user) => (<UserListItem key={user.id} user={user} handleFunction={() => handleAddUser(user)}/>)))}
          </ModalBody>
          <ModalBody>
          </ModalBody>

          <ModalFooter>
            <Button onClick={() => handleRemove(user)} colorScheme="red">
              Leave Group
            </Button>
            
          </ModalFooter>
        </ModalContent>
      </Modal>
    </>
  );
}

export default UpdateGroupChatModal