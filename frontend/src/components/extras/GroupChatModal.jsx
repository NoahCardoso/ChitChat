import { useDisclosure, Modal, ModalOverlay, ModalContent, ModalHeader, ModalCloseButton, ModalFooter, ModalBody, Button, FormControl, Input, useToast, Box } from '@chakra-ui/react';
import React from 'react';
import { useState } from 'react';
import { ChatState } from '../../Context/ChatProvider';
import axios from "axios";
import UserListItem from '../UserAvatar/UserListItem';
import UserBadgeItem from '../UserAvatar/UserBadgeItem';

const GroupChatModal = ({children}) => {
  const {isOpen, onOpen, onClose} = useDisclosure();
  const [groupChatName, setGroupChatName] = useState();
  const [selectedUsers, setSelectedUsers] = useState([]);
  const [search, setSearch] = useState("");
  const [searchResult, setSearchResult] = useState([]);
  const [loading, setLoading] = useState(false);
  const {user, chats, setChats} = ChatState()
  const toast = useToast();

  const handleSearch = async (query) => {
    setSearch(query);
    if (!query){
      return;

    }

    try {
      setLoading(true);

      const { data } = await axios.get(`/api/user?search=${search}`, {
        withCredentials: true,
      });
      setLoading(false)
      setSearchResult(data)
    } catch (error) {
      toast({
				title: "Error Occured!",
				description: "Failed to load the Search Results",
				status: "error",
				duration: 5000,
				isClosable: true,
				position: "bottom-left",
			});

    }
  };

  const handleSubmit = async () => {
    if(!groupChatName || !selectedUsers) {
      toast({
				title: "Please fill all the feilds!",
				status: "warning",
				duration: 5000,
				isClosable: true,
				position: "top",
			});
      return;
    }
    try {
      const { data } = await axios.post(`/api/chat/group`, {
        name: groupChatName,
        users: JSON.stringify(selectedUsers.map((u) => u.id)),
        
      },{ withCredentials: true});

      setChats([data, ...chats]);
      onClose();
      toast({
				title: "New Group Chat Created!",
				status: "success",
				duration: 5000,
				isClosable: true,
				position: "bottom",
			});
    } catch (error) {
      toast({
				title: "Failed to Create the Chat!",
        description: error.response.data,
				status: "error",
				duration: 5000,
				isClosable: true,
				position: "bottom",
			});
    }
  };

  const handleDelete = (delUser) => {
    setSelectedUsers(selectedUsers.filter(sel => sel.id !==delUser.id))
  };

  const handleGroup = (userToAdd) => {
    if(selectedUsers.includes(userToAdd)){
      toast({
        title: "User already added",
        status: "warning",
        duration: 5000,
        isClosable: true,
        position: "top",
      })
      return;
    }
    setSelectedUsers([...selectedUsers, userToAdd])
  };

  return (
    <div>
      <span onClick={onOpen}>{children}</span>

      <Modal isOpen={isOpen} onClose={onClose}>
        <ModalOverlay />
        <ModalContent>
          <ModalHeader
            fontSize="35px"
            fontFamily="Work sans"
            display="flex"
            justifyContent="center"
          >Create Group Chat</ModalHeader>
          <ModalCloseButton />
          <ModalBody display="flex" flexDir="column" alignItems="center">
            <FormControl>
              <Input placeholder="Chat Name" md={3} onChange={(e) => setGroupChatName(e.target.value)}></Input>
            </FormControl>
            <FormControl>
              <Input placeholder="Add Users" md={1} onChange={(e) => handleSearch(e.target.value)}></Input>
            </FormControl>
            <Box w="100%" display="flex" flexWrap="wrap">
            {selectedUsers.map(u => (<UserBadgeItem key={user.id} user={u} handleFunction={() => handleDelete(u)}/>))}
            </Box>
            
            {loading?<div>loading</div> : (searchResult?.slice(0,4).map(user => (<UserListItem key={user.id} user={user} handleFunction={() => handleGroup(user)}></UserListItem>)))}
            
          </ModalBody>

          <ModalFooter>
            <Button colorScheme='blue' mr={3} onClick={handleSubmit}>
              Create Chat
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>
    </div>);
  
}

export default GroupChatModal;