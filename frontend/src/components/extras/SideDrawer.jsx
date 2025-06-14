
import { Tooltip, Box, Button, Icon, Text, Menu, MenuButton, Avatar, MenuList,
	MenuItem, Drawer, useDisclosure, DrawerOverlay, DrawerContent, 
	DrawerHeader, DrawerBody, Input, 
	useToast,
	Spinner
 } from '@chakra-ui/react';
import { BellIcon, ChevronDownIcon } from "@chakra-ui/icons"
import React, {useState} from 'react'
import SearchIcon from '@mui/icons-material/Search';
import {ChatState} from "../../Context/ChatProvider"
import ProfileModal from './ProfileModal';
import { useHistory } from 'react-router-dom';
import axios from "axios";
import ChatLoading from '../ChatLoading';
import UserListItem from '../UserAvatar/UserListItem';

const SideDrawer = () => {
	
	const [search, setSearch] = useState("");
	const [searchResult, setSearchResult] = useState([]);
  //const [searchResult, setSearchResult] = useState([]);
	const [loading, setLoading] = useState(false);
	const [loadingChat, setLoadingChat] = useState();
	const { isOpen, onOpen, onClose } = useDisclosure();
	const {user, setSelectedChat, chats, setChats} = ChatState();

	const history = useHistory();
	const logoutHandler = () => {
		localStorage.removeItem("userInfo");
		history.push("/");
	};

	const toast = useToast();

	const handleSearch= async(query) => {
		setSearch(query);
		if (!query) {
			toast({
				title: "Please Fill all the Feilds!",
				status: "warning",
				duration: 5000,
				isClosable: true,
				position: "bottom",
			});
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
			console.log(err);
		}
	};

	const accessChat = async(userId) => {
    try {
			setLoadingChat(true);

			const { data } = await axios.post(`/api/chat`, {userId}, {
				withCredentials: true, headers: {
				"Content-Type": "application/json",
				},
			});
			
			if(!chats.find((c) => c.id === data.id)){
				setChats([data, ...chats]);
			}



			setSelectedChat(data);
			setLoadingChat(false);
			onClose();
			
		} catch(err) {
			toast({
				title: "Error Occured!",
				description: "Error fetching the chat",
				status: "error",
				duration: 5000,
				isClosable: true,
				position: "bottom-left",
			});
			console.log(err);
		}
	};
  return (<div>
	<Box
		display="flex"
		justifyContent="space-between"
		alignItems="center"
		bg="white"
		w="100%"
		p="5px 10px 5px 10px"
		borderWidth="5px"
	>
		<Tooltip label="Search Users to chat" hasArrow placement="bottom-end">
			<Button variant="ghost" onClick={onOpen}>
				<i className="fas fa-search"/>
				<Text display={{base: "none",md: "flex"}} px="4"> Search User </Text>
			</Button>
		</Tooltip>

		<Text fontSize="2xl" fontFamily="Work sans">
			ChitChat
		</Text>
		
		<div>
			<Menu>
				<MenuButton p={1}>
					<BellIcon fontSize="2xl" m={1}/>
				</MenuButton>
			</Menu>
			<Menu>
				<MenuButton as={Button} rightIcon={<ChevronDownIcon/>}>
					<Avatar size="sm" cursor="pointer" name={user.name} src={user.pic}/>
				</MenuButton>
				<MenuList>
					<ProfileModal user={user}>
						<MenuItem>My Profile</MenuItem>
					</ProfileModal>
					<MenuItem onClick={logoutHandler}>Logout</MenuItem>
				</MenuList>
			</Menu>
		</div>
	</Box>

	<Drawer placement='left' onClose={onClose} isOpen={isOpen}>
		<DrawerOverlay />
		<DrawerContent>
			<DrawerHeader borderBottomWidth="1px">Search Users</DrawerHeader>
			<DrawerBody>
				<Box display="flex" pb={2}>
					<Input placeholder="Search by name or email" mr={2} value={search} onChange={(e) => setSearch(e.target.value)}/>
					<Button onClick={handleSearch}>Go</Button>
				</Box>
				{loading ? (<ChatLoading/>): (searchResult?.map(user => (<UserListItem key={user.id} user={user} handleFunction={() => accessChat(user.id)}/>)))}
				{loadingChat && <Spinner ml="auto" display="flex"/>}
			</DrawerBody>
		</DrawerContent>
	</Drawer>
  </div>);
}

export default SideDrawer;