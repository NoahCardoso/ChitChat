import { ViewIcon } from "@chakra-ui/icons";
import { Button, ModalContent, ModalFooter, ModalHeader, ModalOverlay, useDisclosure, Modal, ModalBody, ModalCloseButton, IconButton, useToast, Box, FormControl, Input } from "@chakra-ui/react";
import React, { useState } from 'react'
import { ChatState } from "../../Context/ChatProvider";
import UserBadgeItem from "../UserAvatar/UserBadgeItem";
import axios from "axios";

const UpdateGroupChatModal = ({ fetchAgain, setFetchAgain }) => {
  const  { isOpen, onOpen, onClose} = useDisclosure();
  const [groupChatName, setGroupChatName] = useState();
  const [search, setSearch] = useState("");
  const [searchResult, setSearchResult] = useState([]);
  const [loading, setLoading] = useState(false);
  const [renameLoading, setRenameLoading] = useState(false);

  const toast = useToast();

  const { selectedChat, setSelectedChat, user} = ChatState();

  const handleRemove = () => {};

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

  const handleSearch = () => {};

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