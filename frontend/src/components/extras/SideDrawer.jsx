
import { Tooltip, Box, Button, Icon, Text, Menu, MenuButton, Avatar, MenuList,
	MenuItem, Drawer, useDisclosure, DrawerOverlay, DrawerContent, 
	DrawerHeader, DrawerBody, Input, 
	useToast
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
	const [loading, setLoading] = useState(false);
	const [loadingChat, setLoadingChat] = useState();
	const { isOpen, onOpen, onClose } = useDisclosure();
	const {user} = ChatState();

	const history = useHistory();
	const logoutHandler = () => {
		localStorage.removeItem("userInfo");
		history.push("/");
	};

	const toast = useToast();

	const handleSearch= async() => {
		if (!search) {
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
			
			onClose()
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

	const accessChat = (userId) => {

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
			LinkUp
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
		</DrawerBody>
		</DrawerContent>
		
	</Drawer>
  </div>);
}

export default SideDrawer;