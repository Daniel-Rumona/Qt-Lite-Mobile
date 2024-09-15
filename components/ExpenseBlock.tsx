import {
    FlatList,
    ListRenderItem,
    StyleSheet,
    Text,
    View,
  } from "react-native";
  import React from "react";
  import { ExpenseType } from "@/types";
  import Colors from "@/constants/Colors";

  const ExpenseBlock = ({ expenseList }: { expenseList: ExpenseType[] }) => {
    const renderItem: ListRenderItem<Partial<ExpenseType>> = ({ item }) => {
      let amount = item.amount.split(".");

      return (
        <View
          style={[
            styles.expenseBlock,
            {
                backgroundColor:
                item.name == "Planned Tasks"
                  ? Colors.blue
                  : item.name == "Completed"
                  ? Colors.white
                  : item.name == "Upcoming"
                  ? Colors.tintColor
                  : item.name == "Overdue"
                  ? "#FFA5BA" // Using #FFA5BA as the background for Overdue
                  : Colors.tintColor, // This is a fallback color if none of the conditions are met
            },
          ]}
        >
          <Text
            style={[
              styles.expenseBlockTxt1,
              {
                color:
                  item.name == "Planned Tasks" || item.name == "Upcoming"
                    ? Colors.black
                    : item.name == "Completed"
                    ? Colors.black
                    : Colors.white,
              },
            ]}
          >
            {item.name}
          </Text>
          <Text
            style={[
              styles.expenseBlockTxt2,
              {
                color:
                  item.name == "Planned Tasks" || item.name == "Upcoming"
                    ? Colors.black
                    : item.name == "Completed"
                    ? Colors.black
                    : Colors.white,
              },
            ]}
          >
            {amount[0]}
            <Text style={styles.expenseBlockTxt2Span}>{amount[1]}</Text>
          </Text>
          <View style={styles.expenseBlock3View}>
            <Text
              style={[
                styles.expenseBlockTxt1,
                {
                  color:
                    item.name == "Planned Tasks" || item.name == "Upcoming"
                      ? Colors.black
                      : item.name == "Completed"
                      ? Colors.black
                      : Colors.white,
                },
              ]}
            >
              {item.percentage}%
            </Text>
          </View>
        </View>
      );
    };

    return (
      <View style={{ paddingVertical: 20 }}>
        <FlatList
          data={expenseList}
          renderItem={renderItem}
          horizontal
          showsHorizontalScrollIndicator={false}
        />
      </View>
    );
  };

  export default ExpenseBlock;

  const styles = StyleSheet.create({
    expenseBlock: {
      backgroundColor: Colors.tintColor,
      width: 100,
      padding: 15,
      borderRadius: 15,
      marginRight: 20,
      gap: 8,
      justifyContent: "space-between",
      alignItems: "flex-start",
    },
    expenseBlockTxt1: {
      color: Colors.white,
      fontSize: 14,
    },
    expenseBlockTxt2: {
      color: Colors.white,
      fontSize: 16,
      fontWeight: "600",
    },
    expenseBlockTxt2Span: {
      fontSize: 12,
      fontWeight: "400",
    },
    expenseBlock3View: {
      backgroundColor: "rgba(255, 255, 255, 0.2)",
      paddingHorizontal: 5,
      paddingVertical: 3,
      borderRadius: 10,
    },
  });
