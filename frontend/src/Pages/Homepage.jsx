import React, { useEffect } from "react"
import {useHistory} from "react-router-dom";
import Login from "../components/Authentication/Login"
import SignUp from "../components/Authentication/SignUp"
import { Container, Box, Text, Tab, Tabs, TabList, TabPanel, TabPanels } from "@chakra-ui/react"

const Homepage = () => {
	const history = useHistory();
	useEffect(() => {
		const user = JSON.parse(localStorage.getItem("userInfo"));
		if(user){
			history.push("/chats");
		}
	}, [history]);
  return (
	<Container maxW="xl" centerContent>
		<Box 
		display="flex"
		justifyContent="center"
		p={3}
		bg={"white"}
		w="100%"
		m="40px 0 15 px 0"
		borderRadius="lg"
		borderWidth="1px"
		>
			<Text fontSize="4xl" fontFamily="work sans" color="black">ChitChat</Text>
		</Box>
		<Box bg="White" w="100%" p ={4} borderRadius="lg" borderWidth="1px">
			<Tabs variant="enclosed">
				<TabList mb="lem">
					<Tab width="50%">Login</Tab>
					<Tab width="50%">Sign Up</Tab>
				</TabList>
				<TabPanels>
					<TabPanel>
					{<Login/>}
					</TabPanel>
					<TabPanel>
					{<SignUp/>}
					</TabPanel>
				</TabPanels>
			</Tabs>
		</Box>
	</Container>
  )
}

export default Homepage