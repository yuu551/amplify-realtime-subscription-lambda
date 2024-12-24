import { useState, useEffect, useRef } from "react";
import { generateClient } from "aws-amplify/data";
import type { Schema } from "../amplify/data/resource";
import { Authenticator } from "@aws-amplify/ui-react";
import { Table, Text, Group, Badge, ScrollArea } from "@mantine/core";
import {
  IconClock,
  IconThermometer,
  IconDroplet,
  IconBolt,
} from "@tabler/icons-react";
import "@mantine/core/styles.css";
import { MantineProvider } from "@mantine/core";

type DeviceStatus = Schema["DeviceStatus"]["type"];

const client = generateClient<Schema>();

function App() {
  const [devices, setDevices] = useState<DeviceStatus[]>([]);
  const [updatedIds, setUpdatedIds] = useState<Set<string>>(new Set());
  const previousDevices = useRef<DeviceStatus[]>([]);

  const getStatusColor = (status: string | null | undefined) => {
    return status === "NORMAL" ? "green" : "red";
  };

  const formatDateTime = (dateString: string) => {
    return new Date(dateString).toLocaleString();
  };

  useEffect(() => {
    const sub = client.models.DeviceStatus.observeQuery().subscribe({
      next: ({ items }) => {
        const sortedItems = [...items].sort(
          (a, b) =>
            new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
        );

        console.log(previousDevices)
        console.log(sortedItems)
  
        const newUpdatedIds = new Set<string>();
        
        // 初回読み込み時は全てのアイテムをハイライト対象とする
        if (previousDevices.current.length === 0) {
          sortedItems.forEach((device) => {
            newUpdatedIds.add(device.id);
          });
        } else {
          // 2回目以降は変更があったアイテムのみをハイライト
          sortedItems.forEach((device) => {
            if (
              !previousDevices.current.find(
                (prev) =>
                  prev.id === device.id &&
                  prev.temperature === device.temperature &&
                  prev.humidity === device.humidity &&
                  prev.status_state === device.status_state
              )
            ) {
              newUpdatedIds.add(device.id);
            }
          });
        }
  
        setDevices(sortedItems);
        setUpdatedIds(newUpdatedIds);
        previousDevices.current = sortedItems;
  
        setTimeout(() => {
          setUpdatedIds(new Set());
        }, 3000);
      },
    });
    return () => sub.unsubscribe();
  }, []);

  const rows = devices.map((device) => (
    <Table.Tr
      key={device.id}
      style={{
        backgroundColor: updatedIds.has(device.id)
          ? "rgba(255, 255, 0, 0.1)"
          : undefined,
        transition: "background-color 0.5s ease",
      }}
    >
      <Table.Td>
        <Group gap="xs">
          <IconClock size={16} />
          <Text size="sm" fw={500}>
            {formatDateTime(device.createdAt)}
          </Text>
        </Group>
      </Table.Td>
      <Table.Td>
        <Text size="sm">{device.device_Id}</Text>
      </Table.Td>
      <Table.Td>
        <Badge color={getStatusColor(device.status_state)}>
          {device.status_state}
        </Badge>
      </Table.Td>
      <Table.Td>
        <Group gap="xs">
          <Text size="sm" c="dimmed">
            {device.status_code}
          </Text>
          <Text size="sm">-</Text>
          <Text size="sm">{device.status_description}</Text>
        </Group>
      </Table.Td>
      <Table.Td>
        <Group gap="xs">
          <IconThermometer size={16} />
          <Text size="sm">{device.temperature}°C</Text>
        </Group>
      </Table.Td>
      <Table.Td>
        <Group gap="xs">
          <IconDroplet size={16} />
          <Text size="sm">{device.humidity}%</Text>
        </Group>
      </Table.Td>
      <Table.Td>
        <Group gap="xs">
          <IconBolt size={16} />
          <Text size="sm">{device.voltage}V</Text>
        </Group>
      </Table.Td>
    </Table.Tr>
  ));

  return (
    <Authenticator>
      <MantineProvider>
        <ScrollArea>
          <Table striped highlightOnHover>
            <Table.Thead>
              <Table.Tr>
                <Table.Th>Timestamp</Table.Th>
                <Table.Th>Device ID</Table.Th>
                <Table.Th>State</Table.Th>
                <Table.Th>Status</Table.Th>
                <Table.Th>Temperature</Table.Th>
                <Table.Th>Humidity</Table.Th>
                <Table.Th>Voltage</Table.Th>
              </Table.Tr>
            </Table.Thead>
            <Table.Tbody>{rows}</Table.Tbody>
          </Table>
        </ScrollArea>
      </MantineProvider>
    </Authenticator>
  );
}

export default App;
