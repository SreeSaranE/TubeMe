using System.Collections.Generic;
using YoutubeDownloader.Models;

namespace YoutubeDownloader.Data.Interfaces
{
    public interface ICategoryRepository
    {
        List<CategoryDetailModel> GetAllWithCount();
        bool Add(string name);
        bool Rename(string oldName, string newName);
        bool Delete(string name);
        bool Exists(string name);
    }
}
