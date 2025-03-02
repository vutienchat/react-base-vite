// const updateSelectedCounts = (
//     nodeId: number,
//     newChecked: Record<number, boolean>
//   ) => {
//     setSelectedCounts((prev) => {
//       const newCounts = new Map(prev);
//       let parentNode: FlatNode | undefined;
//       const updateNodeCount = (id: number) => {
//         const node = flatList.find((n) => n.id === id);
//         if (node?.children) {
//           const total = node.children.length;
//           const selected = node.children.filter(
//             (child) => newChecked[child.id]
//           ).length;
//           if (selected) {
//             if (!parentNode) {
//               parentNode = node;
//             }
//             if (parentNode && parentNode.depth > node.depth) {
//               parentNode = node;
//             }
//           } else {
//             newCounts.delete(id);
//           }
//         }
//       };

//       updateNodeCount(nodeId);
//       getParentIds(nodeId, parentMap).forEach(updateNodeCount);
//       if (parentNode) {
//         newCounts.set(parentNode.id, {
//           total: parentNode.children?.length || 0,
//           selected:
//             parentNode.children?.filter((child) => newChecked[child.id])
//               .length || 0,
//         });
//       }

//       return newCounts;
//     });
//   };
