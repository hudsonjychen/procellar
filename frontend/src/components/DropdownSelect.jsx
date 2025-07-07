import { useState } from 'react'
import Select from '@mui/joy/Select'
import Option from '@mui/joy/Option'

export default function DropdownSelect({ itemList, itemType }) {
    const [selectedItems, setSelectedItems] = useState([])

    const placeholderMap = {
        objectType: 'Object Types...',
        activity: 'Activities...',
    }

    const handleChange = (e, newValue) => {
        setSelectedItems(newValue)
    }

    return (
        <Select
            multiple
            placeholder={placeholderMap[itemType] || 'Select...'}
            sx={{ width: '12rem' }}
            value={selectedItems}
            onChange={handleChange}
            slotProps={{
                listbox: {
                    sx: {
                        width: '100%',
                    }
                }
            }}
        >
            {itemList.map((item) => (
                <Option key={item} value={item}>{item}</Option>
            ))}
        </Select>
    )
}