import React from "react";
import { Button, IconButton, ModalContent, ModalFooter, ModalHeader, ModalOverlay, useDisclosure, Modal, ModalBody, ModalCloseButton, Image, Text, Avatar } from "@chakra-ui/react";
import { ViewIcon } from "@chakra-ui/icons";


const ProfileModal = ({user, children}) => {
	const {isOpen, onOpen, onClose} = useDisclosure();
  return (<div>
		{children ? (<span onClick={onOpen}>{children}</span>) : (<IconButton display={{ base: "flex"}} icon={<ViewIcon />} onClick={onOpen}/>)
		}
		<Modal isOpen={isOpen} onClose={onClose} size="lg" isCentered>
			<ModalOverlay/>
			<ModalContent>
				<ModalHeader
					fontSize="40px"
					fontFamily="Work sans"
					display="flex"
					justifyContent="center"
				>
					{user.name}</ModalHeader>
					{console.log(user)}
				<ModalCloseButton />
				<ModalBody display="flex" flexDir="column" alignItems="center" justifyContent="space-between">
					<Avatar borderRadius="full" boxSize="150px" src={user.pic} alt={user.name} />
					<Text fontSize={{ base: "28px", md: "30px"}}>Email: {user.email}</Text>
				</ModalBody>

				<ModalFooter>
					<Button colorScheme="blue" mr={3} onClick={onClose}>
						Close
					</Button>
				</ModalFooter>
			</ModalContent>
		</Modal>
	</div>);
  
};

export default ProfileModal;